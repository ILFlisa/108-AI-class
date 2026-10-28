import { DefectCase, UserProfile } from '../types/defect';

export const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: '林小安', role: 'OPERATOR', dept: '生產現場／生產一課', avatar: '👷' },
  { id: 'u2', name: '張專員', role: 'DISPATCHER', dept: '客服／維修調度組', avatar: '📋' },
  { id: 'u3', name: '王大明', role: 'TECHNICIAN', dept: '設備維修課', avatar: '🔧' },
  { id: 'u4', name: '李立宏', role: 'ENGINEER', dept: '製程工程部', avatar: '⚙️' },
  { id: 'u5', name: '許雅婷', role: 'QA', dept: '品保檢驗部', avatar: '🔬' },
  { id: 'u6', name: '陳健銘', role: 'SUPERVISOR', dept: '生產部製造處', avatar: '👔' },
  { id: 'u7', name: '資訊系統主管', role: 'ADMIN', dept: '資訊技術處', avatar: '💻' },
];

export const INITIAL_CASES: DefectCase[] = [
  {
    id: 'ABN-20261026-001',
    createdAt: '2026-10-26T08:30:00',
    occurredAt: '2026-10-26T08:15:00',
    reporterName: '林小安',
    reporterDept: '生產現場／生產一課',
    line: '精密車削 A 棟 2 樓',
    productId: 'PRD-M8-SHAFT',
    productName: '高精度傳動主軸 (Ø25)',
    batchNumber: 'LOT-20261026-A1',
    machineId: 'CNC-04',
    defectType: 'DIMENSION',
    defectDesc: '連續 5 件產品外徑尺寸超差，外徑公差要求 25.000 ± 0.005mm，實測達 25.018mm。工件表面有些微抖動紋。',
    defectQuantity: 18,
    unit: '件',
    specStandard: '25.000 ± 0.005 mm',
    actualMeasurement: '25.018 mm (超差 +0.013mm)',
    severity: 'MAJOR',
    containment: 'SHUTDOWN',
    remarks: '已先暫停 CNC-04 加工，同批 18 件半成品已貼黃色隔離標籤移至不良品暫存區。',
    attachments: [
      {
        id: 'att-1',
        name: 'CNC04_三次元檢驗報告_20261026.pdf',
        type: 'application/pdf',
        size: '1.4 MB',
        uploadedAt: '2026-10-26T08:35:00',
        uploadedBy: '林小安'
      },
      {
        id: 'att-2',
        name: 'Shaft_Surface_Chatter.jpg',
        type: 'image/jpeg',
        size: '850 KB',
        uploadedAt: '2026-10-26T08:36:00',
        uploadedBy: '林小安'
      }
    ],
    status: 'IN_PROGRESS',
    classification: {
      category: 'DIMENSION',
      priority: 'MAJOR',
      responsibleDept: '設備維修課',
      classifiedBy: '張專員',
      classifiedAt: '2026-10-26T08:45:00',
      classificationBasis: '尺寸超差且伴隨加工震紋，初判為機台主軸偏擺或軸承預壓不足。'
    },
    revisionRequests: [],
    dispatch: {
      workOrderNo: 'WO-20261026-088',
      assignedDept: '設備維修課',
      primaryAssignee: '王大明',
      collaborators: ['李立宏 (製程工程師)'],
      responseSLAHours: 2,
      targetCompletionDate: '2026-10-26T18:00:00',
      dispatchedBy: '張專員',
      dispatchedAt: '2026-10-26T08:50:00',
      firstResponseAt: '2026-10-26T09:10:00',
      tasks: [
        { id: 't1', title: '主軸徑向跳動量千分錶量測', completed: true, assignee: '王大明' },
        { id: 't2', title: '檢查伺服進給滾珠螺桿預拉與背隙', completed: true, assignee: '王大明' },
        { id: 't3', title: '刀具更換與夾頭同心度補正', completed: false, assignee: '李立宏' }
      ]
    },
    investigation: {
      inspectionItems: [
        { id: 'i1', item: '主軸靜態偏擺量檢測', result: 'NORMAL', measuredValue: '0.002 mm', specStandard: '< 0.003 mm', toolUsed: 'Mitutoyo 千分量表', notes: '冷機靜態偏擺正常' },
        { id: 'i2', item: '主軸動態熱溫升及熱伸長', result: 'ABNORMAL', measuredValue: '+0.015 mm 軸向偏移', specStandard: '< 0.005 mm', toolUsed: '雷射干涉儀 / 熱像儀', notes: '高速旋轉 30 分鐘後前軸承座溫升達 58°C (標準 < 42°C)' },
        { id: 'i3', item: '冷卻油循環流量', result: 'ABNORMAL', measuredValue: '1.2 L/min', specStandard: '4.5 ± 0.5 L/min', toolUsed: '管路流量計', notes: '主軸冷卻油路濾網嚴重油泥堵塞' }
      ],
      possibleCauses: [
        '主軸冷卻油循環受阻導致前軸承過熱膨脹',
        '刀塔定位銷磨損鬆動',
        '來料圓棒料徑公差不足'
      ],
      ruledOutCauses: [
        { cause: '來料圓棒料徑公差不足', reasonWhyRuledOut: '抽檢同捆生料 10 件，外徑皆於規範內 (25.5 ± 0.05mm)' }
      ],
      rootCause: '主軸潤滑冷卻機油濾心長期未更換導致流量衰減至 1.2 L/min，主軸熱伸長 +0.015mm 未被熱補償補正，連帶產生加工尺寸正向偏移。',
      isRootCauseConfirmed: true,
      basisEvidence: '溫升熱像儀測試紀錄顯示前軸承溫差達 16°C；拆卸冷卻泵濾芯發現積碳油泥堵塞率超過 70%。',
      analyzedBy: '王大明 / 李立宏',
      confirmedBy: '李立宏 (製程工程師)',
      confirmedAt: '2026-10-26T11:20:00'
    },
    improvement: {
      description: '1. 清洗冷卻油箱並更換 5μm 高效精密濾芯，恢復冷卻流量至 4.8 L/min。\n2. 重設 CNC 控制器主軸熱伸長補償多項式係數。\n3. 加工首件 5 件進行三次元尺寸全檢。',
      executor: '王大明',
      targetDate: '2026-10-26T14:30:00',
      completedAt: '',
      preData: '外徑 25.018mm, 溫升 58°C, 冷卻流量 1.2 L/min',
      postData: '冷卻流量 4.8 L/min, 主軸溫升穩定於 38.5°C',
      sopUpdateRequired: true,
      sopUpdateDetails: '修訂 CNC 保養標準作業書 WI-MNT-CNC-004，增列「每週巡檢冷卻油流量計與差壓指示計」。'
    },
    verification: {
      criteria: '以合格冷卻狀態連續加工 30 件，外徑尺寸須符合 25.000 ± 0.005mm，製程能力指標 Cpk 須 >= 1.33。',
      sampleQty: 30,
      measurements: '待改善完成後由品保執行連續抽檢',
      verdict: 'SUPPLEMENT_NEEDED',
      verifiedBy: '',
      verifiedAt: '',
      failureReason: ''
    },
    lineResume: {
      isApproved: false,
      approvedBy: '',
      approvedAt: '',
      conditions: '需完成首件 30 顆尺寸全檢通過並經品保與主管簽核。'
    },
    closure: {
      isApproved: false,
      checklist: {
        infoComplete: true,
        rootCauseAnalyzed: true,
        countermeasuresLogged: true,
        qaPassed: false,
        lineResumeDone: false,
        attachmentsReady: true,
        reportReady: false
      },
      isRepeatIssue: false
    },
    timeline: [
      {
        id: 'tl-1',
        timestamp: '2026-10-26 08:30',
        actor: '林小安',
        actorRole: 'OPERATOR',
        action: '建立異常通報並執行停機隔離',
        newStatus: 'PENDING_CONFIRMATION'
      },
      {
        id: 'tl-2',
        timestamp: '2026-10-26 08:45',
        actor: '張專員',
        actorRole: 'DISPATCHER',
        action: '受理案件、核定為重大案件並指定設備維修課',
        previousStatus: 'PENDING_CONFIRMATION',
        newStatus: 'PENDING_DISPATCH'
      },
      {
        id: 'tl-3',
        timestamp: '2026-10-26 08:50',
        actor: '張專員',
        actorRole: 'DISPATCHER',
        action: '開立派工單 WO-20261026-088 指派王大明，協同李立宏',
        previousStatus: 'PENDING_DISPATCH',
        newStatus: 'IN_PROGRESS'
      },
      {
        id: 'tl-4',
        timestamp: '2026-10-26 09:10',
        actor: '王大明',
        actorRole: 'TECHNICIAN',
        action: '維修人員接單現場巡檢，架設千分量表與熱像儀'
      }
    ],
    collaborativeNotes: [
      {
        id: 'cn-1',
        author: '王大明',
        authorRole: 'TECHNICIAN',
        timestamp: '2026-10-26 10:15',
        content: '現場拆機確認冷卻油迴路濾網嚴重結泥，目前已調用庫存新濾芯進行總成替換。'
      },
      {
        id: 'cn-2',
        author: '李立宏',
        authorRole: 'ENGINEER',
        timestamp: '2026-10-26 10:45',
        content: '建議同步檢視補償參數巨集程式 #501~#508，避免熱穩定前切削進刀造成累積誤差。'
      }
    ]
  },
  {
    id: 'ABN-20261026-002',
    createdAt: '2026-10-26T10:15:00',
    occurredAt: '2026-10-26T10:00:00',
    reporterName: '林小安',
    reporterDept: '生產現場／生產二課',
    line: '注塑成型 B 廠區',
    productId: 'PRD-INJ-SHELL',
    productName: '工業手持儀器防護外殼',
    batchNumber: 'LOT-20261026-B2',
    machineId: 'INJ-02',
    defectType: 'APPEARANCE',
    defectDesc: '成型外殼表面近進膠口處出現明顯縮水凹痕 (Sink Marks) 與銀絲紋，連續抽查 10 件皆有不良。',
    defectQuantity: 45,
    unit: '件',
    specStandard: '表面光滑無收縮下陷、無銀紋流痕 (依樣品標桿 Grade A)',
    actualMeasurement: '凹痕深度 0.25mm，肉眼明顯可見下陷',
    severity: 'NORMAL',
    containment: 'CONTINUE_OBSERVING',
    remarks: '已先微調模溫機設定由 65°C 升至 75°C，並進行樣品隔離。',
    attachments: [
      {
        id: 'att-3',
        name: 'Sink_Mark_Defect.jpg',
        type: 'image/jpeg',
        size: '1.2 MB',
        uploadedAt: '2026-10-26T10:18:00',
        uploadedBy: '林小安'
      }
    ],
    status: 'PENDING_CONFIRMATION',
    revisionRequests: [],
    investigation: {
      inspectionItems: [],
      possibleCauses: ['保壓壓力或保壓時間不足', '原料乾燥不完全導致水氣銀絲', '模具排氣孔堵塞'],
      ruledOutCauses: [],
      rootCause: '',
      isRootCauseConfirmed: false,
      basisEvidence: '',
      analyzedBy: ''
    },
    improvement: {
      description: '',
      executor: '',
      targetDate: '',
      preData: '',
      postData: '',
      sopUpdateRequired: false
    },
    verification: {
      criteria: '連續抽檢 50 件表面外觀判定符合標準比對色樣與目視規準',
      sampleQty: 50,
      measurements: '',
      verdict: 'SUPPLEMENT_NEEDED'
    },
    lineResume: { isApproved: false },
    closure: {
      isApproved: false,
      checklist: {
        infoComplete: true,
        rootCauseAnalyzed: false,
        countermeasuresLogged: false,
        qaPassed: false,
        lineResumeDone: false,
        attachmentsReady: true,
        reportReady: false
      },
      isRepeatIssue: false
    },
    timeline: [
      {
        id: 'tl-10',
        timestamp: '2026-10-26 10:15',
        actor: '林小安',
        actorRole: 'OPERATOR',
        action: '填寫通報表單並送出',
        newStatus: 'PENDING_CONFIRMATION'
      }
    ],
    collaborativeNotes: []
  },
  {
    id: 'ABN-20261025-003',
    createdAt: '2026-10-25T14:20:00',
    occurredAt: '2026-10-25T13:45:00',
    reporterName: '現場技術員-陳志豪',
    reporterDept: '生產現場／電子組裝課',
    line: 'SMT 高速貼片 1 號線',
    productId: 'PCBA-MCU-V3',
    productName: '車載控制器主板 PCBA',
    batchNumber: 'LOT-20261025-SMT',
    machineId: 'SMT-01',
    defectType: 'MATERIAL',
    defectDesc: '回焊後 AOI 檢測多顆 QFN-48 封裝引腳出現嚴重錫橋短路與假焊空焊。',
    defectQuantity: 32,
    unit: '片',
    specStandard: 'IPC-A-610 Class 3 標準，空焊率 0 ppm',
    actualMeasurement: 'AOI 檢測不良率 14.5% (32/220 片)',
    severity: 'MAJOR',
    containment: 'QUARANTINE',
    remarks: '通報資訊初次缺少鍚膏批號與回溫時間。',
    attachments: [],
    status: 'REVISION_REQUIRED',
    classification: {
      category: 'MATERIAL',
      priority: 'MAJOR',
      responsibleDept: '品保檢驗部',
      classifiedBy: '張專員',
      classifiedAt: '2026-10-25T14:40:00',
      classificationBasis: '涉及焊接品質與物料追溯，需補齊鍚膏批號'
    },
    revisionRequests: [
      {
        id: 'rev-1',
        requestedAt: '2026-10-25T14:45:00',
        requestedBy: '張專員 (受理人員)',
        reason: '請通報人補登：1. 現場使用的錫膏型號與製造批號；2. 錫膏冷藏回溫解凍記錄卡照片；3. 鋼板開孔厚度與擦拭頻率。未補齊無法分派工程調查。'
      }
    ],
    investigation: {
      inspectionItems: [],
      possibleCauses: ['錫膏回溫未達標產生水氣錫珠', '鋼板擦拭不良引起溢錫'],
      ruledOutCauses: [],
      rootCause: '',
      isRootCauseConfirmed: false,
      basisEvidence: '',
      analyzedBy: ''
    },
    improvement: {
      description: '',
      executor: '',
      targetDate: '',
      preData: '',
      postData: '',
      sopUpdateRequired: false
    },
    verification: { criteria: '100% AOI 檢驗通過', sampleQty: 100, measurements: '' },
    lineResume: { isApproved: false },
    closure: {
      isApproved: false,
      checklist: {
        infoComplete: false,
        rootCauseAnalyzed: false,
        countermeasuresLogged: false,
        qaPassed: false,
        lineResumeDone: false,
        attachmentsReady: false,
        reportReady: false
      },
      isRepeatIssue: false
    },
    timeline: [
      {
        id: 'tl-20',
        timestamp: '2026-10-25 14:20',
        actor: '陳志豪',
        actorRole: 'OPERATOR',
        action: '建立通報單',
        newStatus: 'PENDING_CONFIRMATION'
      },
      {
        id: 'tl-21',
        timestamp: '2026-10-25 14:45',
        actor: '張專員',
        actorRole: 'DISPATCHER',
        action: '退回補件：要求提供錫膏批號與回溫記錄',
        previousStatus: 'PENDING_CONFIRMATION',
        newStatus: 'REVISION_REQUIRED'
      }
    ],
    collaborativeNotes: []
  },
  {
    id: 'ABN-20261024-004',
    createdAt: '2026-10-24T09:00:00',
    occurredAt: '2026-10-24T08:50:00',
    reporterName: '林小安',
    reporterDept: '生產現場／表面處理課',
    line: '回焊加熱 3 號區',
    productId: 'PCBA-PWR-800',
    productName: '800W 大功率伺服電源板',
    batchNumber: 'LOT-20261024-PW',
    machineId: 'OVN-03',
    defectType: 'PROCESS_PARAM',
    defectDesc: '第 4 溫區熱電偶感測溫度跳動異常，製程監控跳警報溫度超溫 +18°C。',
    defectQuantity: 12,
    unit: '片',
    specStandard: '設定溫度 235 ± 3°C',
    actualMeasurement: '實測溫度 253°C',
    severity: 'CRITICAL',
    containment: 'SHUTDOWN',
    remarks: '緊急停爐，並將爐內 12 片進行標示抽離隔離。',
    attachments: [
      {
        id: 'att-4',
        name: 'Oven_Temp_Profile_Alarm.csv',
        type: 'text/csv',
        size: '340 KB',
        uploadedAt: '2026-10-24T09:10:00',
        uploadedBy: '林小安'
      }
    ],
    status: 'PENDING_VERIFICATION',
    classification: {
      category: 'PROCESS_PARAM',
      priority: 'CRITICAL',
      responsibleDept: '製程工程部',
      classifiedBy: '張專員',
      classifiedAt: '2026-10-24T09:15:00',
      classificationBasis: '涉及關鍵溫控製程超溫，可能破壞功率半導體壽命'
    },
    revisionRequests: [],
    dispatch: {
      workOrderNo: 'WO-20261024-041',
      assignedDept: '製程工程部',
      primaryAssignee: '李立宏',
      collaborators: ['王大明 (維修)'],
      responseSLAHours: 1,
      targetCompletionDate: '2026-10-24T16:00:00',
      dispatchedBy: '張專員',
      dispatchedAt: '2026-10-24T09:20:00',
      firstResponseAt: '2026-10-24T09:30:00',
      tasks: [
        { id: 'ot1', title: '熱電偶校正與訊號放大器阻抗測量', completed: true, assignee: '李立宏' },
        { id: 'ot2', title: '更換老化 K-type 熱電偶與加熱固態繼電器 (SSR)', completed: true, assignee: '王大明' }
      ]
    },
    investigation: {
      inspectionItems: [
        { id: 'oi1', item: '第 4 溫區 SSR 固態繼電器導通電阻', result: 'ABNORMAL', measuredValue: '0.2 歐姆 (擊穿短路)', specStandard: '斷開時 > 1M 歐姆', notes: 'SSR 輸出端半導體擊穿，導致加熱器常時全功率加熱' },
        { id: 'oi2', item: 'K-type 熱電偶線路絕緣阻抗', result: 'NORMAL', measuredValue: '50M 歐姆', specStandard: '> 10M 歐姆', notes: '感溫線路正常' }
      ],
      possibleCauses: ['SSR 擊穿導致加熱管失控', 'PLC PID 模組損壞'],
      ruledOutCauses: [
        { cause: 'PLC PID 模組損壞', reasonWhyRuledOut: '更換測試模組後控制輸出電壓訊號邏輯正常' }
      ],
      rootCause: '第 4 區 SSR 繼電器因散熱膏乾涸且過載擊穿，處於常時接通狀態，致使加熱棒持續全載輸出導致超溫。',
      isRootCauseConfirmed: true,
      basisEvidence: '三用電表測得 SSR 在無觸發信號下主接點持續導通；拆卸發現散熱鋁片底座積灰碳化。',
      analyzedBy: '李立宏 / 王大明',
      confirmedBy: '李立宏',
      confirmedAt: '2026-10-24T12:00:00'
    },
    improvement: {
      description: '1. 更換歐規工業級 50A 固態繼電器 (含過溫自我保護型號)。\n2. 重新塗抹高導熱散熱膏並加裝強制散熱風扇。\n3. 實施 9 點無線爐溫循跡 (DataPaq) 實測校正。',
      executor: '李立宏 / 王大明',
      targetDate: '2026-10-24T15:00:00',
      completedAt: '2026-10-24T14:40:00',
      preData: '溫區失控實測 253°C，SSR 擊穿',
      postData: 'DataPaq 測得第 4 溫區穩定於 235.2 ± 0.8°C',
      sopUpdateRequired: true,
      sopUpdateDetails: '增列回焊爐配電盤散熱器每季拆洗與紅外熱像儀定期熱點巡檢點檢表。'
    },
    verification: {
      criteria: '以 DataPaq 測溫板連續測試 3 次，測溫曲線各溫區公差須小於 ±2.5°C；並進行 20 片過爐焊點推拉力測試。',
      sampleQty: 20,
      measurements: 'DataPaq 測試 3 回合皆於 ±1.2°C 內；正待品保確認推拉力測試數值。',
      verdict: 'SUPPLEMENT_NEEDED',
      verifiedBy: '',
      verifiedAt: ''
    },
    lineResume: {
      isApproved: false,
      conditions: '需等品保完成推拉力與金相切片檢驗後方可復線。'
    },
    closure: {
      isApproved: false,
      checklist: {
        infoComplete: true,
        rootCauseAnalyzed: true,
        countermeasuresLogged: true,
        qaPassed: false,
        lineResumeDone: false,
        attachmentsReady: true,
        reportReady: false
      },
      isRepeatIssue: false
    },
    timeline: [
      {
        id: 'tl-31',
        timestamp: '2026-10-24 09:00',
        actor: '林小安',
        actorRole: 'OPERATOR',
        action: '超溫警報觸發，停機通報',
        newStatus: 'PENDING_CONFIRMATION'
      },
      {
        id: 'tl-32',
        timestamp: '2026-10-24 09:20',
        actor: '張專員',
        actorRole: 'DISPATCHER',
        action: '重大緊急派工給製程李立宏',
        newStatus: 'IN_PROGRESS'
      },
      {
        id: 'tl-33',
        timestamp: '2026-10-24 14:45',
        actor: '李立宏',
        actorRole: 'ENGINEER',
        action: '完成 SSR 更換與測溫，送交品保進行品質驗證',
        previousStatus: 'IN_PROGRESS',
        newStatus: 'PENDING_VERIFICATION'
      }
    ],
    collaborativeNotes: []
  },
  {
    id: 'ABN-20261023-005',
    createdAt: '2026-10-23T11:00:00',
    occurredAt: '2026-10-23T10:30:00',
    reporterName: '林小安',
    reporterDept: '生產現場／精密車削',
    line: '精密車削 A 棟 2 樓',
    productId: 'PRD-M8-SHAFT',
    productName: '高精度傳動主軸 (Ø25)',
    batchNumber: 'LOT-20261023-A0',
    machineId: 'CNC-04',
    defectType: 'DIMENSION',
    defectDesc: '倒角端面崩刃，C0.5 倒角部產生毛邊與超差，深度實測達 0.85mm。',
    defectQuantity: 25,
    unit: '件',
    specStandard: '倒角 C0.5 ± 0.1 mm, 無毛邊',
    actualMeasurement: '倒角 C0.85 mm, 邊緣毛邊 0.2mm',
    severity: 'MAJOR',
    containment: 'PARAM_ADJUST',
    remarks: '更換新刀片並補償 Z 軸深度。',
    attachments: [],
    status: 'PENDING_CLOSURE',
    classification: {
      category: 'DIMENSION',
      priority: 'MAJOR',
      responsibleDept: '製程工程部',
      classifiedBy: '張專員',
      classifiedAt: '2026-10-23T11:15:00',
      classificationBasis: '刀具磨耗管理問題'
    },
    revisionRequests: [],
    dispatch: {
      workOrderNo: 'WO-20261023-019',
      assignedDept: '製程工程部',
      primaryAssignee: '李立宏',
      collaborators: ['王大明'],
      responseSLAHours: 2,
      targetCompletionDate: '2026-10-23T17:00:00',
      dispatchedBy: '張專員',
      dispatchedAt: '2026-10-23T11:20:00',
      firstResponseAt: '2026-10-23T11:40:00',
      tasks: [{ id: 'dt1', title: '刀具壽命計數器閾值修正', completed: true, assignee: '李立宏' }]
    },
    investigation: {
      inspectionItems: [
        { id: 'di1', item: '4 號倒角車刀刀尖磨耗顯微檢查', result: 'ABNORMAL', measuredValue: '崩刃缺口 0.35mm', specStandard: 'Vb < 0.15mm', notes: '已超越刀具正常耐磨極限' }
      ],
      possibleCauses: ['刀具壽命計數未設定自動停機', '操作員手動重設次數未換刀'],
      ruledOutCauses: [],
      rootCause: 'CNC 機台系統中 4 號倒角刀具加工次數上限設定為 1200 次，但實際材料批次含硬質碳化物夾雜，刀具耐磨極限僅約 750 次。',
      isRootCauseConfirmed: true,
      basisEvidence: '檢視刀具壽命履歷，該刀片已連續加工 920 次，超過耐磨臨界點。',
      analyzedBy: '李立宏',
      confirmedBy: '李立宏',
      confirmedAt: '2026-10-23T13:30:00'
    },
    improvement: {
      description: '1. 下修 CNC 系統 4 號刀具更換預警上限為 700 次，強制鎖機換刀。\n2. 導入塗層硬質合金耐磨刀片 (TiAlN)。',
      executor: '李立宏',
      targetDate: '2026-10-23T15:00:00',
      completedAt: '2026-10-23T14:30:00',
      preData: '刀具加工 920 次崩刃超差 C0.85',
      postData: '更換塗層刀片並設定 700 次強制換刀，連續試切 10 件 C0.51mm 合格',
      sopUpdateRequired: true,
      sopUpdateDetails: '更新刀具壽命管制表與換刀作業指導書。'
    },
    verification: {
      criteria: '品保抽檢 30 件倒角尺寸，須全數落於 C0.40 ~ C0.60 mm 且目視無毛邊。',
      sampleQty: 30,
      measurements: '全數合格 (C0.48 ~ C0.52mm), 目視 100% 無毛邊',
      verdict: 'PASSED',
      verifiedBy: '許雅婷 (品保工程師)',
      verifiedAt: '2026-10-23T16:30:00'
    },
    lineResume: {
      isApproved: true,
      approvedBy: '陳健銘 (生產主管)',
      approvedAt: '2026-10-23T17:00:00',
      conditions: '已確認刀具壽命預警設定生效，准予復線連續量產。'
    },
    closure: {
      isApproved: false,
      checklist: {
        infoComplete: true,
        rootCauseAnalyzed: true,
        countermeasuresLogged: true,
        qaPassed: true,
        lineResumeDone: true,
        attachmentsReady: true,
        reportReady: true
      },
      isRepeatIssue: false
    },
    timeline: [
      {
        id: 'tl-41',
        timestamp: '2026-10-23 11:00',
        actor: '林小安',
        actorRole: 'OPERATOR',
        action: '建立通報單',
        newStatus: 'PENDING_CONFIRMATION'
      },
      {
        id: 'tl-42',
        timestamp: '2026-10-23 11:20',
        actor: '張專員',
        actorRole: 'DISPATCHER',
        action: '派工給製程李立宏',
        newStatus: 'IN_PROGRESS'
      },
      {
        id: 'tl-43',
        timestamp: '2026-10-23 14:30',
        actor: '李立宏',
        actorRole: 'ENGINEER',
        action: '完成改善送交品保驗證',
        newStatus: 'PENDING_VERIFICATION'
      },
      {
        id: 'tl-44',
        timestamp: '2026-10-23 16:30',
        actor: '許雅婷',
        actorRole: 'QA',
        action: '品質驗證判定【合格通過】',
        newStatus: 'PENDING_CLOSURE'
      },
      {
        id: 'tl-45',
        timestamp: '2026-10-23 17:00',
        actor: '陳健銘',
        actorRole: 'SUPERVISOR',
        action: '簽核復線核准，等待最終結案報告核准'
      }
    ],
    collaborativeNotes: []
  },
  {
    id: 'ABN-20261020-006',
    createdAt: '2026-10-20T08:00:00',
    occurredAt: '2026-10-20T07:45:00',
    reporterName: '機台操作員-周建廷',
    reporterDept: '生產現場／沖壓沖孔組',
    line: '重型沖壓 2 廠',
    productId: 'BRK-STAMP-40',
    productName: '汽車底盤高張力鋼支架',
    batchNumber: 'LOT-20261020-ST',
    machineId: 'PRESS-07',
    defectType: 'EQUIPMENT',
    defectDesc: '沖床主液壓油缸密封圈老化破損噴油，下死點保壓噸位由 200T 跌至 140T，沖孔邊緣產生嚴重撕裂變形。',
    defectQuantity: 50,
    unit: '件',
    specStandard: '保壓 200 ± 5T，邊緣撕裂率 0%',
    actualMeasurement: '保壓 140T，50 件全數翻邊撕裂',
    severity: 'CRITICAL',
    containment: 'SHUTDOWN',
    remarks: '已即時拉下緊急停機斷電，現場防溢油吸油棉佈置完成。',
    attachments: [],
    status: 'CLOSED',
    classification: {
      category: 'EQUIPMENT',
      priority: 'CRITICAL',
      responsibleDept: '設備維修課',
      classifiedBy: '張專員',
      classifiedAt: '2026-10-20T08:10:00',
      classificationBasis: '重型設備液壓失效與工安防護'
    },
    revisionRequests: [],
    dispatch: {
      workOrderNo: 'WO-20261020-002',
      assignedDept: '設備維修課',
      primaryAssignee: '王大明',
      collaborators: ['陳健銘 (現場指揮)'],
      responseSLAHours: 1,
      targetCompletionDate: '2026-10-20T16:00:00',
      dispatchedBy: '張專員',
      dispatchedAt: '2026-10-20T08:15:00',
      firstResponseAt: '2026-10-20T08:25:00',
      tasks: [{ id: 'pt1', title: '更換氟橡膠密封環組並充注液壓油', completed: true, assignee: '王大明' }]
    },
    investigation: {
      inspectionItems: [
        { id: 'pi1', item: '主液壓缸活塞桿表面粗糙度與油封狀態', result: 'ABNORMAL', measuredValue: '油封局部硬化開裂', notes: '油封使用時數已達 6200 小時 (標準壽命 5000 小時)' }
      ],
      possibleCauses: ['油封超期未檢修疲勞失效'],
      ruledOutCauses: [],
      rootCause: '預防保養排程延宕，液壓油封超期服役 1200 小時致使橡膠高溫硬化碎裂。',
      isRootCauseConfirmed: true,
      basisEvidence: '保養履歷查核無更換紀錄，殘餘油封斷口呈現熱硬化碎裂特徵。',
      analyzedBy: '王大明',
      confirmedBy: '陳健銘',
      confirmedAt: '2026-10-20T11:00:00'
    },
    improvement: {
      description: '更換進口耐高溫耐磨氟橡膠油封，補充 ISO VG46 抗磨液壓油 80L，更換迴油濾網並將油封更換納入 ERP PM 預防保養強制工單。',
      executor: '王大明',
      targetDate: '2026-10-20T15:00:00',
      completedAt: '2026-10-20T14:30:00',
      preData: '壓力 140T 漏油',
      postData: '全載打壓 210T 保持 10 分鐘無滲漏無降壓',
      sopUpdateRequired: true,
      sopUpdateDetails: '修訂 PM-PRS-001 沖床定期保養點檢基準書。'
    },
    verification: {
      criteria: '連續試沖 50 件，孔徑與孔邊撕裂全檢，保壓噸位曲線記錄符合 200 ± 5T。',
      sampleQty: 50,
      measurements: '50 件尺寸孔徑 CPK 1.62，撕裂率 0%',
      verdict: 'PASSED',
      verifiedBy: '許雅婷 (品保工程師)',
      verifiedAt: '2026-10-20T16:00:00'
    },
    lineResume: {
      isApproved: true,
      approvedBy: '陳健銘 (生產主管)',
      approvedAt: '2026-10-20T16:30:00',
      conditions: '已復歸且保養工單閉環。'
    },
    closure: {
      isApproved: true,
      approvedBy: '陳健銘 (廠長/主管)',
      approvedAt: '2026-10-20T17:30:00',
      approvalRemarks: '原因明確、改善措施到位，已補強 ERP 預防保養排程，准予結案入庫。',
      checklist: {
        infoComplete: true,
        rootCauseAnalyzed: true,
        countermeasuresLogged: true,
        qaPassed: true,
        lineResumeDone: true,
        attachmentsReady: true,
        reportReady: true
      },
      isRepeatIssue: false
    },
    timeline: [
      { id: 'tl-51', timestamp: '2026-10-20 08:00', actor: '周建廷', actorRole: 'OPERATOR', action: '通報異常', newStatus: 'PENDING_CONFIRMATION' },
      { id: 'tl-52', timestamp: '2026-10-20 08:15', actor: '張專員', actorRole: 'DISPATCHER', action: '派工', newStatus: 'IN_PROGRESS' },
      { id: 'tl-53', timestamp: '2026-10-20 14:30', actor: '王大明', actorRole: 'TECHNICIAN', action: '完工提交驗證', newStatus: 'PENDING_VERIFICATION' },
      { id: 'tl-54', timestamp: '2026-10-20 16:00', actor: '許雅婷', actorRole: 'QA', action: '品保驗證通過', newStatus: 'PENDING_CLOSURE' },
      { id: 'tl-55', timestamp: '2026-10-20 17:30', actor: '陳健銘', actorRole: 'SUPERVISOR', action: '核准結案', previousStatus: 'PENDING_CLOSURE', newStatus: 'CLOSED' }
    ],
    collaborativeNotes: []
  },
  {
    id: 'ABN-20261018-007',
    createdAt: '2026-10-18T13:00:00',
    occurredAt: '2026-10-18T12:40:00',
    reporterName: '林小安',
    reporterDept: '生產現場／電子測試組',
    line: '功能測試 2 號站',
    productId: 'PCBA-MCU-V3',
    productName: '車載控制器主板 PCBA',
    batchNumber: 'LOT-20261018-T2',
    machineId: 'TST-02',
    defectType: 'FUNCTION',
    defectDesc: '測試治具探針接觸電阻過高，導致 CAN-Bus 通訊阻抗檢測值偶發超標 (測得 145 歐姆，標準 120 ± 5 歐姆)。',
    defectQuantity: 8,
    unit: '片',
    specStandard: '120 ± 5 歐姆',
    actualMeasurement: '145 歐姆',
    severity: 'NORMAL',
    containment: 'CONTINUE_OBSERVING',
    remarks: '本案為重複發生問題 (重複標記)',
    attachments: [],
    status: 'CLOSED',
    classification: {
      category: 'FUNCTION',
      priority: 'NORMAL',
      responsibleDept: '設備維修課',
      classifiedBy: '張專員',
      classifiedAt: '2026-10-18T13:20:00',
      classificationBasis: '治具探針氧化'
    },
    revisionRequests: [],
    investigation: {
      inspectionItems: [
        { id: 'ti1', item: '金手指探針表面鍍金磨耗與氧化度', result: 'ABNORMAL', measuredValue: '接觸電阻 25 歐姆', notes: '鍍金層磨損露出底層銅合金氧化' }
      ],
      possibleCauses: ['探針使用次數超過 20 萬次未更換'],
      ruledOutCauses: [],
      rootCause: '測試治具微動彈簧探針鍍金層磨損氧化，接觸電阻增加 25 歐姆造成量測假警報。',
      isRootCauseConfirmed: true,
      basisEvidence: '更換全新鍍金探針後阻抗量測即刻回歸 120.2 歐姆。',
      analyzedBy: '王大明',
      confirmedBy: '李立宏',
      confirmedAt: '2026-10-18T14:30:00'
    },
    improvement: {
      description: '全面更換高耐久鈹銅鍍厚金探針，並於測試治具增設累計測試次數自動警報 (每 15 萬次更換)。',
      executor: '王大明',
      targetDate: '2026-10-18T16:00:00',
      completedAt: '2026-10-18T15:30:00',
      preData: '阻抗 145 歐姆 (假不良)',
      postData: '阻抗 120.2 歐姆',
      sopUpdateRequired: false
    },
    verification: {
      criteria: '以標準黃金樣品校正板連續測試 100 次，量測值皆須在 120 ± 1 歐姆內。',
      sampleQty: 100,
      measurements: '100 次連續測試標準差 σ=0.22 歐姆，無任何跳動',
      verdict: 'PASSED',
      verifiedBy: '許雅婷 (品保工程師)',
      verifiedAt: '2026-10-18T16:30:00'
    },
    lineResume: {
      isApproved: true,
      approvedBy: '陳健銘',
      approvedAt: '2026-10-18T16:45:00'
    },
    closure: {
      isApproved: true,
      approvedBy: '陳健銘',
      approvedAt: '2026-10-18T17:15:00',
      approvalRemarks: '治具探針更換並已建立次數預警機制，同意結案。',
      checklist: {
        infoComplete: true,
        rootCauseAnalyzed: true,
        countermeasuresLogged: true,
        qaPassed: true,
        lineResumeDone: true,
        attachmentsReady: true,
        reportReady: true
      },
      isRepeatIssue: true,
      linkedPriorCaseId: 'ABN-20260912-003'
    },
    timeline: [
      { id: 'tl-61', timestamp: '2026-10-18 13:00', actor: '林小安', actorRole: 'OPERATOR', action: '通報阻抗異常', newStatus: 'PENDING_CONFIRMATION' },
      { id: 'tl-62', timestamp: '2026-10-18 17:15', actor: '陳健銘', actorRole: 'SUPERVISOR', action: '核准結案', previousStatus: 'PENDING_CLOSURE', newStatus: 'CLOSED' }
    ],
    collaborativeNotes: []
  }
];
