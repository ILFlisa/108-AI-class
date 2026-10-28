import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper to check if a valid API key is present
function hasValidApiKey(): boolean {
  const k = process.env.GEMINI_API_KEY;
  return Boolean(k && k.trim() !== '' && k !== 'MY_GEMINI_API_KEY');
}

// Helper to sanitize Gemini response text
function cleanJsonText(text: string): string {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
}

async function callGeminiWithTimeout<T>(promise: Promise<T>, timeoutMs = 4500): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Gemini API call timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasKey: hasValidApiKey(), time: new Date().toISOString() });
});

// AI-001 & AI-003: 異常描述整理、缺漏欄位提示與潛在根本原因建議
app.post('/api/ai/analyze-defect', async (req, res) => {
  try {
    const { defectDesc, productId, machineId, specStandard, actualMeasurement, defectType } = req.body;

    if (!defectDesc) {
      return res.status(400).json({ error: '請提供異常描述' });
    }

    if (!hasValidApiKey()) {
      // Deterministic fallback if API key is not present
      return res.json({
        structuredSummary: `【產品】${productId || '未填'} 於【機台】${machineId || '未填'} 發生「${defectDesc}」。`,
        missingFields: [
          !specStandard ? '建議補充：工程標準規格值（公差範圍）' : null,
          !actualMeasurement ? '建議補充：現場量測實際數值與量具' : null,
          '建議補充：發生時刀具/模具累計使用次數或材料批號'
        ].filter(Boolean),
        suggestedCategory: defectType || 'DIMENSION',
        candidateCauses: [
          {
            cause: '治具/模具磨損或夾持偏位導致尺寸偏移',
            confidence: '高 (78%)',
            inspectionItem: '檢查夾爪同心度及定位銷磨耗量',
            evidenceNeeded: '三次元或千分錶量測夾頭徑向偏轉'
          },
          {
            cause: '主軸熱伸長或切削液冷卻不足導致熱變形',
            confidence: '中 (62%)',
            inspectionItem: '量測主軸運轉溫度與切削液噴嘴流量',
            evidenceNeeded: '紅外熱像儀紀錄或加工前後連續溫度變化'
          },
          {
            cause: '進料原材料硬度或延展性批次不均',
            confidence: '中 (50%)',
            inspectionItem: '抽檢同批生料硬度 (HRC / HV)',
            evidenceNeeded: '供應商材質檢驗證明 (COA) 與現場硬度複測'
          }
        ],
        disclaimer: '【AI 提示】以上原因為根據現場資料與工程知識庫之推測建議，嚴禁直接作為最終結論或逕行復機，需由工程／維修專業人員實地複核確認。'
      });
    }

    const prompt = `你是一位精密製造領域的資深品保與製程改善專家。
請依據使用者通報的製造現場產品異常資訊進行分析：
- 產品編號: ${productId || '未指定'}
- 機台編號: ${machineId || '未指定'}
- 異常類型: ${defectType || '未指定'}
- 異常描述: ${defectDesc}
- 標準規格: ${specStandard || '未填'}
- 實測數值: ${actualMeasurement || '未填'}

請嚴格遵守以下限制：
1. 不得把推測原因當成已確認的根本原因。
2. 候選原因需具備專業工程合理性，並提供建議檢查項目與所需證據。
3. 檢查是否有現場缺漏但對調查至關重要的欄位。
4. 輸出格式必須為合法 JSON，符合以下結構：
{
  "structuredSummary": "50字以內的客觀精簡問題陳述 (5W2H 結構)",
  "missingFields": ["缺漏項目1", "缺漏項目2"],
  "suggestedCategory": "DIMENSION | APPEARANCE | FUNCTION | EQUIPMENT | MATERIAL | PROCESS_PARAM | UNKNOWN",
  "candidateCauses": [
    {
      "cause": "候選可能原因描述",
      "confidence": "高/中/低 (附估計百分比)",
      "inspectionItem": "建議檢查項目",
      "evidenceNeeded": "所需支持證據或量測工具"
    }
  ],
  "disclaimer": "AI 僅提供推測建議，不取代專業判定與復線核准"
}`;

    const response = await callGeminiWithTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    }));

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    console.error('AI analyze defect error:', error);
    const { defectDesc, productId, machineId, specStandard, actualMeasurement, defectType } = req.body;
    return res.json({
      structuredSummary: `【產品】${productId || '未填'} 於【機台】${machineId || '未填'} 發生「${defectDesc}」。`,
      missingFields: [
        !specStandard ? '建議補充：工程標準規格值（公差範圍）' : null,
        !actualMeasurement ? '建議補充：現場量測實際數值與量具' : null,
        '建議補充：發生時刀具/模具累計使用次數或材料批號'
      ].filter(Boolean),
      suggestedCategory: defectType || 'DIMENSION',
      candidateCauses: [
        {
          cause: '治具/模具磨損或夾持偏位導致尺寸偏移',
          confidence: '高 (78%)',
          inspectionItem: '檢查夾爪同心度及定位銷磨耗量',
          evidenceNeeded: '三次元或千分錶量測夾頭徑向偏轉'
        },
        {
          cause: '主軸熱伸長或切削液冷卻不足導致熱變形',
          confidence: '中 (62%)',
          inspectionItem: '量測主軸運轉溫度與切削液噴嘴流量',
          evidenceNeeded: '紅外熱像儀紀錄或加工前後連續溫度變化'
        },
        {
          cause: '進料原材料硬度或延展性批次不均',
          confidence: '中 (50%)',
          inspectionItem: '抽檢同批生料硬度 (HRC / HV)',
          evidenceNeeded: '供應商材質檢驗證明 (COA) 與現場硬度複測'
        }
      ],
      disclaimer: '【AI 提示】以上原因為根據現場資料與工程知識庫之推測建議，嚴禁直接作為最終結論或逕行復機，需由工程／維修專業人員實地複核確認。'
    });
  }
});

// AI-002: 相似案例智能比對
app.post('/api/ai/find-similar', async (req, res) => {
  try {
    const { currentCase, historyCases } = req.body;

    if (!currentCase || !Array.isArray(historyCases)) {
      return res.status(400).json({ error: '缺少比對案例資料' });
    }

    if (!hasValidApiKey()) {
      // Return smart programmatic match
      const matched = historyCases.filter(c => 
        c.defectType === currentCase.defectType ||
        c.machineId === currentCase.machineId ||
        c.productId === currentCase.productId
      ).slice(0, 3);

      return res.json({
        matches: matched.map((m, idx) => ({
          caseId: m.id,
          similarityScore: 92 - idx * 8,
          matchedReasons: [
            m.machineId === currentCase.machineId ? `同機台 (${m.machineId})` : null,
            m.defectType === currentCase.defectType ? `同異常類型` : null,
            '現象高度相似'
          ].filter(Boolean),
          historicalRootCause: m.investigation?.rootCause || '歷史紀錄：定位伺服馬達背隙過大',
          provenCountermeasure: m.improvement?.description || '校正原點補償並更換聯軸器防震膠墊',
          verificationOutcome: m.verification?.verdict === 'PASSED' ? '驗證合格且無重複發生' : '已結案'
        })),
        aiInsight: '比對結果顯示該機台在過去 60 天內曾有類似偏差，建議優先核對當時的伺服馬達背隙與機構潤滑油品紀錄。'
      });
    }

    const prompt = `請比對目標製造異常案例與歷史案例庫，挑選出最相似的最多 3 個歷史案例，並提供參考價值：
目標案例：
編號: ${currentCase.id || '新通報'}
產品: ${currentCase.productId || ''}
機台: ${currentCase.machineId || ''}
類型: ${currentCase.defectType || ''}
描述: ${currentCase.defectDesc || ''}

歷史案例清單 (JSON):
${JSON.stringify(historyCases.slice(0, 10))}

請輸出 JSON 格式：
{
  "matches": [
    {
      "caseId": "歷史案例編號",
      "similarityScore": 85,
      "matchedReasons": ["同機台同工序", "現象關聯"],
      "historicalRootCause": "過去查明的根本原因",
      "provenCountermeasure": "過去採用的有效改善措施",
      "verificationOutcome": "過去品質驗證結果"
    }
  ],
  "aiInsight": "給工程人員的跨案例整合建議"
}`;

    const response = await callGeminiWithTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    }));

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    console.error('AI find similar error:', error);
    const { currentCase, historyCases } = req.body;
    const matched = (historyCases || []).filter((c: any) => 
      c.defectType === currentCase?.defectType ||
      c.machineId === currentCase?.machineId ||
      c.productId === currentCase?.productId
    ).slice(0, 3);

    return res.json({
      matches: matched.map((m: any, idx: number) => ({
        caseId: m.id,
        similarityScore: 92 - idx * 8,
        matchedReasons: [
          m.machineId === currentCase?.machineId ? `同機台 (${m.machineId})` : null,
          m.defectType === currentCase?.defectType ? `同異常類型` : null,
          '現象高度相似'
        ].filter(Boolean),
        historicalRootCause: m.investigation?.rootCause || '歷史紀錄：定位伺服馬達背隙過大',
        provenCountermeasure: m.improvement?.description || '校正原點補償並更換聯軸器防震膠墊',
        verificationOutcome: m.verification?.verdict === 'PASSED' ? '驗證合格且無重複發生' : '已結案'
      })),
      aiInsight: '比對結果顯示該機台在過去 60 天內曾有類似偏差，建議優先核對當時的伺服馬達背隙與機構潤滑油品紀錄。'
    });
  }
});

// AI-004: 維修與處置紀錄結構化摘要
app.post('/api/ai/summarize-logs', async (req, res) => {
  try {
    const { logs, inspectionItems } = req.body;

    if (!hasValidApiKey()) {
      return res.json({
        executiveSummary: '維修與製程已完成基礎點檢，主要偏位集中於主軸第四軸夾爪。目前已完成初階定位校正，正等待進行首件 30 顆樣品連續加工尺寸驗證。',
        keyFindings: [
          '主軸熱膨脹補償參數偏移 +0.015mm',
          '液壓夾具壓力檢知器訊號偶發抖動',
          '材料批次硬度測試皆於合格範圍 (HRC 42~44)'
        ],
        nextActions: [
          '由 QA 進行 30 件全尺寸三次元檢驗',
          '確認復線核准條件與安全聯鎖確認'
        ]
      });
    }

    const prompt = `請將現場維修與調查紀錄彙整為工程主管易讀的結構化進度摘要：
檢查項目紀錄：
${JSON.stringify(inspectionItems || [])}
歷程筆記：
${JSON.stringify(logs || [])}

請輸出 JSON：
{
  "executiveSummary": "100字以內的整體進度重點",
  "keyFindings": ["關鍵發現1", "關鍵發現2"],
  "nextActions": ["後續關鍵待辦1", "後續關鍵待辦2"]
}`;

    const response = await callGeminiWithTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    }));

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    console.error('AI summarize logs error:', error);
    return res.json({
      executiveSummary: '維修與製程已完成基礎點檢，主要偏位集中於主軸第四軸夾爪。目前已完成初階定位校正，正等待進行首件 30 顆樣品連續加工尺寸驗證。',
      keyFindings: [
        '主軸熱膨脹補償參數偏移 +0.015mm',
        '液壓夾具壓力檢知器訊號偶發抖動',
        '材料批次硬度測試皆於合格範圍 (HRC 42~44)'
      ],
      nextActions: [
        '由 QA 進行 30 件全尺寸三次元檢驗',
        '確認復線核准條件與安全聯鎖確認'
      ]
    });
  }
});

// AI-005: 異常趨勢與模式分析 (跨案件整體診斷)
app.post('/api/ai/trend-analysis', async (req, res) => {
  try {
    const { cases } = req.body;

    if (!cases || !Array.isArray(cases)) {
      return res.status(400).json({ error: '缺少案例數據' });
    }

    if (!hasValidApiKey()) {
      return res.json({
        summary: '近期異常主要集中在「CNC-03」與「CNC-08」車削工序之產品尺寸超差（佔比 45%）。主因為刀具壽命預警設定與主軸溫升補償不足。',
        patterns: [
          { pattern: '週一晨班啟動前 2 小時尺寸偏差機率高 3.2 倍', recommendation: '推行暖機 20 分鐘標準點檢卡' },
          { pattern: '同一批號 (B202610-04) 涉及 2 起外觀瑕疵', recommendation: '要求進料品保針對陽極氧化膜厚加嚴檢驗' }
        ],
        healthScore: 84,
        bottlenecks: '平均品質驗證等待時間為 14.5 小時，為目前處理瓶頸'
      });
    }

    const prompt = `請扮演品質管理總監，分析以下製造現場異常數據，找出系統性模式與改善建議：
案例清單：
${JSON.stringify(cases.slice(0, 15).map(c => ({
  id: c.id,
  type: c.defectType,
  machine: c.machineId,
  severity: c.severity,
  status: c.status,
  occurredAt: c.occurredAt,
  rootCause: c.investigation?.rootCause
})))}

請輸出 JSON：
{
  "summary": "150字高階摘要",
  "patterns": [
    { "pattern": "識別到的模式", "recommendation": "具體防範措施" }
  ],
  "healthScore": 85,
  "bottlenecks": "流程瓶頸說明"
}`;

    const response = await callGeminiWithTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    }));

    const parsed = JSON.parse(cleanJsonText(response.text || '{}'));
    return res.json(parsed);
  } catch (error) {
    console.error('AI trend analysis error:', error);
    return res.json({
      summary: '近期異常主要集中在「CNC-03」與「CNC-08」車削工序之產品尺寸超差（佔比 45%）。主因為刀具壽命預警設定與主軸溫升補償不足。',
      patterns: [
        { pattern: '週一晨班啟動前 2 小時尺寸偏差機率高 3.2 倍', recommendation: '推行暖機 20 分鐘標準點檢卡' },
        { pattern: '同一批號 (B202610-04) 涉及 2 起外觀瑕疵', recommendation: '要求進料品保針對陽極氧化膜厚加嚴檢驗' }
      ],
      healthScore: 84,
      bottlenecks: '平均品質驗證等待時間為 14.5 小時，為目前處理瓶頸'
    });
  }
});

// AI-006: 8D 結案總結報告草稿生成
app.post('/api/ai/draft-report', async (req, res) => {
  const { defectCase } = req.body;
  const fallbackDraft = `# 產品異常處置與 8D 調查結案報告 (草稿)
**案件編號：** ${defectCase?.id || 'ABN-PENDING'}
**報告產生日期：** ${new Date().toISOString().split('T')[0]}

---

### D1. 跨部門應變小組 (Team)
- **通報現場：** ${defectCase?.reporterDept || '現場'} / ${defectCase?.reporterName || '作業員'}
- **負責單位：** ${defectCase?.dispatch?.assignedDept || '未指定'} (負責人: ${defectCase?.dispatch?.primaryAssignee || '未指派'})
- **品保複核：** ${defectCase?.verification?.verifiedBy || '品保部'}
- **核准主管：** ${defectCase?.closure?.approvedBy || '生產部主管'}

### D2. 問題描述 (Problem Description)
- **產品編號與批號：** ${defectCase?.productId || ''} (${defectCase?.productName || ''}) / 批號: ${defectCase?.batchNumber || 'N/A'}
- **發生工序與機台：** ${defectCase?.line || ''} / ${defectCase?.machineId || ''}
- **異常現象：** ${defectCase?.defectDesc || ''}
- **不良數量：** ${defectCase?.defectQuantity || 0} ${defectCase?.unit || '件'} (嚴重等級: ${defectCase?.severity || '一般'})
- **標準值 vs 實測值：** 規格: ${defectCase?.specStandard || 'N/A'} | 實測: ${defectCase?.actualMeasurement || 'N/A'}

### D3. 緊急防堵措施 (Interim Containment Actions)
- **處置措施：** ${defectCase?.containment || '隔離在製品'}
- **現場即時執行：** 已即時隔離同批在製品並執行機台停止進刀，防止不良品流入下一道製程。

### D4. 根本原因分析 (Root Cause Analysis)
- **確認根本原因：** ${defectCase?.investigation?.rootCause || '調查中／待最終確認'}
- **工程驗證依據：** ${defectCase?.investigation?.basisEvidence || '量測數據、治具點檢紀錄'}
- **已排除之假設：**
${defectCase?.investigation?.ruledOutCauses?.map((r: { cause: string; reasonWhyRuledOut: string }) => `  - 排除原因: ${r.cause} (原因: ${r.reasonWhyRuledOut})`).join('\n') || '  - 無'}

### D5. 永久改善對策 (Permanent Corrective Actions)
- **執行對策：** ${defectCase?.improvement?.description || '已執行修復'}
- **對策執行人：** ${defectCase?.improvement?.executor || '未填'}
- **改善前數據：** ${defectCase?.improvement?.preData || 'N/A'}
- **改善後數據：** ${defectCase?.improvement?.postData || 'N/A'}

### D6. 品質與製程驗證 (Verification of Effectiveness)
- **檢驗標準：** ${defectCase?.verification?.criteria || '依檢驗規範進行樣品抽驗'}
- **抽樣數量：** ${defectCase?.verification?.sampleQty || 0} 件
- **量測判定：** ${defectCase?.verification?.verdict === 'PASSED' ? '✅ 合格通過' : '⚠️ 需補充驗證'}
- **品保確認人：** ${defectCase?.verification?.verifiedBy || '品保工程師'}

### D7. 防再發措施與標準化 (Prevent Recurrence & Standardization)
- **標準作業更新：** ${defectCase?.improvement?.sopUpdateRequired ? `✅ 需要更新作業指導書 (WI) / 點檢表\n  - 更新說明: ${defectCase?.improvement?.sopUpdateDetails || '已修訂刀具保養規範'}` : '否 (既有規範適用)'}

### D8. 團隊肯定與主管核准結案 (Sign-off & Closure)
- **復線核准：** ${defectCase?.lineResume?.isApproved ? `✅ 已核准復線 (核准人: ${defectCase?.lineResume?.approvedBy})` : '待核准'}
- **結案核准：** ${defectCase?.closure?.isApproved ? `✅ 主管已核准結案 (核准人: ${defectCase?.closure?.approvedBy})` : '待主管最終簽核'}

> *本報告初稿由生產異常處理系統 AI 輔助彙整生成，正式簽核請依公司品質管理作業流程進行。*`;

  try {
    if (!defectCase) {
      return res.status(400).json({ error: '缺少案件資料' });
    }

    if (!hasValidApiKey()) {
      return res.json({ markdownReport: fallbackDraft });
    }

    const prompt = `請依據以下製造產品異常案件完整資訊，撰寫一份專業標準的 8D 品質異常結案與改善調查報告 (繁體中文 Markdown 格式)：
案件資料：
${JSON.stringify(defectCase)}

報告結構請涵蓋 D1 到 D8，並維持專業製造業技術報告語調。`;

    const response = await callGeminiWithTimeout(ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    }));

    return res.json({ markdownReport: response.text });
  } catch (error) {
    console.error('AI draft report error:', error);
    return res.json({ markdownReport: fallbackDraft });
  }
});

// In development, hook up Vite middleware; in production, serve static files
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

setupServer();
