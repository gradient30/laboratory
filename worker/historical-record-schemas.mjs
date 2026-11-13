// Read-only historical record schemas. Frozen exact day/age/version identities only.
// Each identity has its own immutable source; Day123 v1 and v2 remain distinct.
// No progress router, SQL, database migration, write path, or snapshot priority change.
// Object hashes: sorted-key compact UTF-8 JSON; unescaped Unicode; no newline.
const schemas=Object.freeze(Object.fromEntries(Object.entries({
  "24:4-6:v1": {
    "protocolSha256": "ea97ed0fdb3219a2f9205720a1082d66f05a2d36b1f2d5fc2e51dc1b970e1af4",
    "recordFieldsSha256": "a025331800715d6ad531ec4af49cdf7397397131a8519b6cd75988feab617480",
    "recordFields": [
      "起点原色与部位",
      "6/24小时变化或看不清",
      "浸水与停止原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "014436ed96bfa518e49edc92d4ee9a2d4d7d531515f82123fc0834249560abcb"
    }
  },
  "123:13-16:v1": {
    "protocolSha256": "2d4f43255be8c7543cbae356285c52f651bba55249940b3b12c389810de92251",
    "recordFieldsSha256": "d2678f4ac39a2fe3d9221630ac076058aa14dfb6a5c94a6960312a980022eb2a",
    "recordFields": [
      "T、实际s/w/f与p/q",
      "清水空白实际投料",
      "各次含盘质量和时间",
      "末三读数间隔与绝对差",
      "液层/污染/洒出异常",
      "表观r及r/q、A/B差异",
      "空白与复溶实际观察",
      "未完成和非纯度结论"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "cbd972f17345c144b98deb62e103f744c27b08f7fece66e3635b322079cd36b7"
    }
  },
  "261:4-6:v1": {
    "protocolSha256": "7aaecc4d1347649c330755b8b2e19dab6085199864bbeb13eee25e186a214bcc",
    "recordFieldsSha256": "cd7bf2240a20106ec86048facac7657259f1fcd96d9d8155d52c3221e4d4e756",
    "recordFields": [
      "模型单位和给定输入",
      "原猜想/计算与订正",
      "遗漏项和假设零",
      "同等任务证据未知",
      "有限结论/帮助"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "9b99341f1f48da4be1b02c7d5fea3b02648692077bdd93d19a8e5206978a3eda"
    }
  },
  "261:7-9:v1": {
    "protocolSha256": "17adc098e3e2ec3a80e4b8b0d78d97ae19a9463d819bb666146fbb78782f3e25",
    "recordFieldsSha256": "cd7bf2240a20106ec86048facac7657259f1fcd96d9d8155d52c3221e4d4e756",
    "recordFields": [
      "模型单位和给定输入",
      "原猜想/计算与订正",
      "遗漏项和假设零",
      "同等任务证据未知",
      "有限结论/帮助"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "9b99341f1f48da4be1b02c7d5fea3b02648692077bdd93d19a8e5206978a3eda"
    }
  },
  "261:10-12:v1": {
    "protocolSha256": "1cf12e3cfe2ab8b0a823e9f79edf82315e537004f2e5d164b1b6be53a4c3e149",
    "recordFieldsSha256": "cd7bf2240a20106ec86048facac7657259f1fcd96d9d8155d52c3221e4d4e756",
    "recordFields": [
      "模型单位和给定输入",
      "原猜想/计算与订正",
      "遗漏项和假设零",
      "同等任务证据未知",
      "有限结论/帮助"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "9b99341f1f48da4be1b02c7d5fea3b02648692077bdd93d19a8e5206978a3eda"
    }
  },
  "261:13-16:v1": {
    "protocolSha256": "4943bfc454577eb3f02e411c661c39dc114c86a5ef7e1c9df84b0d9bbd428db3",
    "recordFieldsSha256": "cd7bf2240a20106ec86048facac7657259f1fcd96d9d8155d52c3221e4d4e756",
    "recordFields": [
      "模型单位和给定输入",
      "原猜想/计算与订正",
      "遗漏项和假设零",
      "同等任务证据未知",
      "有限结论/帮助"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "9b99341f1f48da4be1b02c7d5fea3b02648692077bdd93d19a8e5206978a3eda"
    }
  },
  "277:4-6:v1": {
    "protocolSha256": "6205d6b35d3631a92c8b043b31daebd508978f6cf6a519bc8f123ae6ea4727fb",
    "recordFieldsSha256": "2d4198986036939e997c26c39f570dff0ce7defe4854e291428b0d3163c0c235",
    "recordFields": [
      "一块冰，同一碟A",
      "孩子只看说画",
      "未融完也可结束",
      "成人清理水"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "33e55a5b7c24057e8d218f454e8649c3f23bdfdb38f2478d2f35615c199e68bc"
    }
  },
  "277:7-9:v1": {
    "protocolSha256": "4396e404712a6daeb688857b8ba1c95f6fb38b52672dda3afe92b04171196f5c",
    "recordFieldsSha256": "24d2dfc90f14bc569cd5d4103111e0ccf222bb4e4d0751b279ddd943d78b1000",
    "recordFields": [
      "每次记真实时刻",
      "漏看写缺测",
      "湿痕不是水质量",
      "前后保留同标签"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "33e55a5b7c24057e8d218f454e8649c3f23bdfdb38f2478d2f35615c199e68bc"
    }
  },
  "277:10-12:v1": {
    "protocolSha256": "699df45b299cbff077e3d401235687d4a304592800d2ed51207b268ca9ceb7be",
    "recordFieldsSha256": "b495f4ae482ae775bd6120b044be13503877d3c37cd523548c5830811bab741e",
    "recordFields": [
      "看见与猜测分列",
      "末有冰/首无冰",
      "未测质量要说明",
      "开口可能有交换"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "33e55a5b7c24057e8d218f454e8649c3f23bdfdb38f2478d2f35615c199e68bc"
    }
  },
  "277:13-16:v1": {
    "protocolSha256": "9f8b5d8621069fcff6cb9946b5bacdb43c36edd74e21627b6dff9bdb0d2cd985",
    "recordFieldsSha256": "2fa95788dff5cf3f7fa27873686364e611eb11e3a4d463d7ab8fbc20a7cd2a8b",
    "recordFields": [
      "先实录后做纸题",
      "边界决定收支项",
      "区间不是精确相等",
      "称量仅纸上设计"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "33e55a5b7c24057e8d218f454e8649c3f23bdfdb38f2478d2f35615c199e68bc"
    }
  },
  "283:4-6:v1": {
    "protocolSha256": "d4cfc1183c61a5d7dc5e91a767c46dc8a419082b8916d915d6a103ed58cb6de7",
    "recordFieldsSha256": "ef6a5e8c4a66ccd5f1c4b398622ec09661fdb8f8e835a3b06750b78e093d0663",
    "recordFields": [
      "成人称量不触冰",
      "A整块 B小块",
      "孩子只看说画",
      "未知可以保留"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "88315d80fc995ba787e4f5e479f2f141e9a5e5145ef10b19e686730d491280bf"
    }
  },
  "283:7-9:v1": {
    "protocolSha256": "f3ede3a6d71d1fd54c5de4d3829a6d8c7c6f2046817880b7c4140d49bef7e5ac",
    "recordFieldsSha256": "358490903d4a3462e3d60b2e457324cba7945effb3204bd1a83961547a7e8810",
    "recordFields": [
      "A/B标签对应",
      "写真实公共时刻",
      "漏看记缺测",
      "先后不强求"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "88315d80fc995ba787e4f5e479f2f141e9a5e5145ef10b19e686730d491280bf"
    }
  },
  "283:10-12:v1": {
    "protocolSha256": "ff22be76b3faabf0bac481345f1109946cdac03032307b8ce63e40208e6062e8",
    "recordFieldsSha256": "3c279fc53877103f45023f6d44f053b4cd56ab889dc2cd0b9c0c0fee0529a82f",
    "recordFields": [
      "净值要减各自皮重",
      "延迟和融水要记录",
      "区间重叠不强排",
      "不是只改面积"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "88315d80fc995ba787e4f5e479f2f141e9a5e5145ef10b19e686730d491280bf"
    }
  },
  "283:13-16:v1": {
    "protocolSha256": "0a73c0c564cd63cda737b12e05a2e14636aad895e702815e9ccce465f26e11e1",
    "recordFieldsSha256": "00a2eab8cdf9e257c3055c4fe150f46c5af632eb1df0c6124568f939e2cf7ec4",
    "recordFields": [
      "几何面积另题",
      "误差区间非相等",
      "热传递不只面积",
      "不推固定时间比"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "88315d80fc995ba787e4f5e479f2f141e9a5e5145ef10b19e686730d491280bf"
    }
  },
  "289:4-6:v1": {
    "protocolSha256": "7790250c91972130c0c6d212d95e4800bb6d992d2c468f5397c4853a010f9b3d",
    "recordFieldsSha256": "f3f2f58492a330a0509c3f2158b052e5fc949e95c028d5a5cf9f0193551de834",
    "recordFields": [
      "成人量水与移盖",
      "孩子只指画说",
      "看不清也是记录",
      "最多3天即结束"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "a607ed5b22e831cd419d2458b46a1a54fb0e2df6836e980767fda94d2c7889b8"
    }
  },
  "289:10-12:v1": {
    "protocolSha256": "36f98d4c0ce340a694878ad2301af4dcc7f9759ecbf06a286e09d40ae6f0329d",
    "recordFieldsSha256": "0aad6fc6fec6ef2b1a70a95cf6b996bc296a5634c9211d976c8a7fa17e3b5f41",
    "recordFields": [
      "盖下水珠非质量",
      "移盖会改变系统",
      "轻盖不等于密闭",
      "因果结论有边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-20261106/dist/data.json",
      "datasetSha256": "3bf739be5ff0a71bb7c16ea12ed561504815ed8399e819ef1d89f08196f3dcb6",
      "dayAssetSha256": "a607ed5b22e831cd419d2458b46a1a54fb0e2df6836e980767fda94d2c7889b8"
    }
  },
  "20:4-6:v1": {
    "protocolSha256": "0c5ee136293f60f42bbefc03478cba7cc03793c4abe526fe2a69f12d6c403e2d",
    "recordFieldsSha256": "3806ec79179356cf80c890ce7423a6680233c4b7a143abb750b51ac9318035a2",
    "recordFields": [
      "刚放入时看到什么",
      "5/15分钟新泡或没看清",
      "成人代记与停止原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "4a7906cc483e5c7ced031a8a5bd089097cb090b9e34202013aad386e5cada216"
    }
  },
  "20:7-9:v1": {
    "protocolSha256": "1544e6be840c00f4cf25e583889bb4e09c78d1042a1857bb30e184eee1ce38c0",
    "recordFieldsSha256": "1a87cd5692c5339680fdd3b4c9b8a043dee5408aa5ab2a0bce2fb3e0d626916c",
    "recordFields": [
      "W水杯三个时窗",
      "V醋杯三个时窗",
      "膜残留、漂起或其他异常"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "4a7906cc483e5c7ced031a8a5bd089097cb090b9e34202013aad386e5cada216"
    }
  },
  "20:10-12:v1": {
    "protocolSha256": "5793ea4bd8383b1438784f90d8ef2b70989b96b808c0686690bebfa30a1cf751",
    "recordFieldsSha256": "554febf9d7eb361470ac2d7a3fee4ff5c83629f3d5e33d152b0eb0c86e7aeeaa",
    "recordFields": [
      "蛋1的W/D/V三时窗",
      "蛋2的V/D/W三时窗",
      "实际时刻、壳差异和无效杯",
      "同蛋趋势与跨蛋一致性限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "4a7906cc483e5c7ced031a8a5bd089097cb090b9e34202013aad386e5cada216"
    }
  },
  "20:13-16:v1": {
    "protocolSha256": "5397cd01895c7edf9673df91f231d1c9531e38095158f30ea6f13c64185c29c5",
    "recordFieldsSha256": "9329ae006003463785f7d87aa30c6078c7dc7990e275505aa0a4a80def982399",
    "recordFields": [
      "两蛋四格的真实膜状态与姿态",
      "各杯0/5/15分钟新泡类别",
      "气泡位置、遮挡和制备失败",
      "同蛋/跨蛋比较与推断边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "4a7906cc483e5c7ced031a8a5bd089097cb090b9e34202013aad386e5cada216"
    }
  },
  "37:4-6:v1": {
    "protocolSha256": "66e3c8c74d4bff0c363bc0ae7b7ddb278d4fdd778cdd8c02c19fad47291c7d4f",
    "recordFieldsSha256": "46c2c2848de11fb6376cfc14d9abb0db2fa439aafac8790aeaa1da95d3ec523e",
    "recordFields": [
      "A与B水面画图",
      "成人读起始/回收水量",
      "洒漏或看不清"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c0e56f87db9d3f893db939c0961904205bf7c23b0520194dcf1fcba22b1791bc"
    }
  },
  "37:7-9:v1": {
    "protocolSha256": "67c9c14a04e74ec465300c27c86854af64e19df638904289249ab87a976d4367",
    "recordFieldsSha256": "f983be941edb1d60712479284d02b0c22b9b0595ddc8ff8abd9873d056c3db46",
    "recordFields": [
      "四次杯号与到线读数/超限",
      "两杯半高定义",
      "重做差异和洒漏"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c0e56f87db9d3f893db939c0961904205bf7c23b0520194dcf1fcba22b1791bc"
    }
  },
  "37:10-12:v1": {
    "protocolSha256": "95a540dcc129f0883c3c2f7895929d009deb30e7def984fd13b35862d271c0d9",
    "recordFieldsSha256": "bbb3394abc6c7cc87625f6df8b281c5dbf17f47555ba578a5fe2dcedeb5ff2c8",
    "recordFields": [
      "四轮各杯底尺数与液面尺数",
      "各次水深与相邻增量",
      "溅漏/挂壁与累计误差",
      "两杯关系与重复限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c0e56f87db9d3f893db939c0961904205bf7c23b0520194dcf1fcba22b1791bc"
    }
  },
  "37:13-16:v1": {
    "protocolSha256": "63f9ac96e7f90c0f834ddb68c50e112f9daec09e739a865d96580af92a813cc4",
    "recordFieldsSha256": "9ac14aed78d6cd73f7f271379f4b9218b1a37bcaf5f2b21ff18f056414eec893",
    "recordFields": [
      "12次条件/回收量或超限",
      "每格3次完整性与范围",
      "H/V跨杯差异",
      "同量具与转移次数限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c0e56f87db9d3f893db939c0961904205bf7c23b0520194dcf1fcba22b1791bc"
    }
  },
  "31:4-6:v1": {
    "protocolSha256": "2d90cf4c62ffd3ae6f46af0c370b8a9c0b44d7a8808dca99e799ad1cde779567",
    "recordFieldsSha256": "65ca59c4067448a14c2319a7cdbe8fb8faf8d22ef63f20d4b72122a8bc31c701",
    "recordFields": [
      "平片松手表现",
      "圆筒松手表现",
      "底部接触与未完成原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "34361a74743397e0b0e9ab0762823f6b41af3e50cb38d7b882f8b5783e376d68"
    }
  },
  "31:7-9:v1": {
    "protocolSha256": "53ee5a37d5bdecb6f17136f9da15a195a48e90d4bfa592c88e69414b56255d65",
    "recordFieldsSha256": "f7dacbaa354c3f0ad8424350f08525095e5f5dbcc6a37815e2bed9396fd71fa9",
    "recordFields": [
      "裁片、折线与接缝检查",
      "板/橡皮质量与居中检查",
      "三柱各阶段及停止情况",
      "可见变化位置与结论范围"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "34361a74743397e0b0e9ab0762823f6b41af3e50cb38d7b882f8b5783e376d68"
    }
  },
  "31:10-12:v1": {
    "protocolSha256": "d8754e6fbf8cd9560bddee35b67d18405309a246910052712db2cbb04576b29a",
    "recordFieldsSha256": "f46666967827bb2f2a583710ab13bd8df35ede5258d1067201267a57aad20397",
    "recordFields": [
      "六根编号/实际高度/原纸来源",
      "同一板和橡皮质量",
      "六根各阶段与停止原因",
      "同高度差异及卸载后观察"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "34361a74743397e0b0e9ab0762823f6b41af3e50cb38d7b882f8b5783e376d68"
    }
  },
  "31:13-16:v1": {
    "protocolSha256": "9ccd650de714dcb6f8b3e9cb3b9d8796bec6f5cf1f743780591cbea6fbbedb63",
    "recordFieldsSha256": "11b956505a846d3c316b6db86823c35b1d959b9441d837505e6faa968a012bf5",
    "recordFields": [
      "两张原纸裁切图与八根编号",
      "高度/顶宽/接缝/板载荷实测检查",
      "八根各阶段与可见变化位置",
      "分因素比较及理想模型限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "34361a74743397e0b0e9ab0762823f6b41af3e50cb38d7b882f8b5783e376d68"
    }
  },
  "145:4-6:v1": {
    "protocolSha256": "ff979e2fcc66fc1608489de5223bf8d24dec459e6d03234ab0345b7d5b13860c",
    "recordFieldsSha256": "a989cb901c9c0be8409d6edf79fff7bcbf7a2d4f90b41e39d8e16b69103497c9",
    "recordFields": [
      "整体与大方片尺寸",
      "单片实际覆盖哪一角",
      "成人带数的25格",
      "两片分开或重叠",
      "实际覆盖图与符号配对",
      "数错或未对齐及修正"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "24441dd5e72ed92c523725091583dfcbd06fef8f9551192bead761e35d2c1dca"
    }
  },
  "145:7-9:v1": {
    "protocolSha256": "3a4c7a0c606a8676f882281f5b4fbd6de45377554f7900e60df7601d2ec2ddd7",
    "recordFieldsSha256": "0a626e0c807100730eb9ab5edac1a26b91804165ec5948c4e5063c6380b92aef",
    "recordFields": [
      "五条各5/10的核数",
      "第一种实际行位置",
      "第二种实际行位置与倒转",
      "重叠/越界及修正",
      "整张有色数和100分母",
      "单条有色数和10分母",
      "两种图与25%/50%对应"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "24441dd5e72ed92c523725091583dfcbd06fef8f9551192bead761e35d2c1dca"
    }
  },
  "145:10-12:v1": {
    "protocolSha256": "faae5e35ebaf32ac36a46140a91dd651a077474ae7ec64dc08e571fc6920ceb3",
    "recordFieldsSha256": "1e789fd8c591597b914b7da22b1fa499649c7ed589313f14358fbb6799ca5a70",
    "recordFields": [
      "U/V实际边长与格距",
      "模型整体面积和单位",
      "对应覆盖各25格",
      "两片实际互换结果",
      "1cm细格与局部补线",
      "四种面积/整体/百分数",
      "手画误差与格数限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "24441dd5e72ed92c523725091583dfcbd06fef8f9551192bead761e35d2c1dca"
    }
  },
  "145:13-16:v1": {
    "protocolSha256": "0e075a51a82d2dc052ab2200210c02329b9d825257ad0ca44262872bda87216b",
    "recordFieldsSha256": "cf83cfb74db227fd23de349d5b6e713fdf7aeb9f1d4cda8116d32d15bec2929d",
    "recordFields": [
      "虚构模型与甲乙原始计数",
      "各组分母和80%/20%",
      "甲5条乙15条的唯一编号",
      "重拼100格与35标记核数",
      "漏放/重叠/复制检查",
      "50%简单平均的问题定义",
      "35%加权合并的计算",
      "模型范围与实际操作修正"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "24441dd5e72ed92c523725091583dfcbd06fef8f9551192bead761e35d2c1dca"
    }
  },
  "72:4-6:v1": {
    "protocolSha256": "b8d5f851d3cdbf6d7757ae7ff2ffed4d2668c47e68e168ae7c2b6092eea731bc",
    "recordFieldsSha256": "f3b3dbf8002bc02497d507e629aa8ac91b79225f93ce571ab34787d28d5f3ee5",
    "recordFields": [
      "两方向原始猜想",
      "顺向放入和取出",
      "转向接触的位置",
      "转回复试结果"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "918c9241d00dedade4201375bcd210e5fa4eb49dc8a49542eaeff84338441d3e"
    }
  },
  "72:7-9:v1": {
    "protocolSha256": "87f7919b4cbce524239de2369eba63926cbdd5c53e01b68e12da5ec2d9c6d667",
    "recordFieldsSha256": "3842931f9ffa976b3501b7cf08e0354daad46c381d51c3fc5030021ef8fd24c3",
    "recordFields": [
      "估计与两次外/内尺寸",
      "本尺寸与单位",
      "无垫总余量和取放",
      "加垫净距、余量及取放",
      "撤垫恢复与异常"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "918c9241d00dedade4201375bcd210e5fa4eb49dc8a49542eaeff84338441d3e"
    }
  },
  "72:10-12:v1": {
    "protocolSha256": "32aae919f2b25886c3fb08bfed4905727fb124c9f816d787192a90a5391c264a",
    "recordFieldsSha256": "c0b31100292c8393b248df25d24a5884c3461a1558afa94de8545b7713778b01",
    "recordFields": [
      "六尺寸两次读数及范围",
      "六朝向边对应与预测",
      "六次入口/到底/高度/取出",
      "选定朝向的两次复试",
      "近似体积与模型反例"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "918c9241d00dedade4201375bcd210e5fa4eb49dc8a49542eaeff84338441d3e"
    }
  },
  "72:13-16:v1": {
    "protocolSha256": "32a391e7e61ec64593550d9cfc523e556319ff730d82ec741e8b9da32ea941e5",
    "recordFieldsSha256": "2e1d6d2ac6b081cb6d495ad7a23a1f15cb2db324d2879370df384a7e3d1593eb",
    "recordFields": [
      "8盒最大外包尺寸与容器净距",
      "单层规则和重复读数",
      "统一A/B实际数量",
      "混合3次数量与取放情况",
      "理想矩形假设和两种界",
      "实物最好方案与未认证事项"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "918c9241d00dedade4201375bcd210e5fa4eb49dc8a49542eaeff84338441d3e"
    }
  },
  "93:4-6:v1": {
    "protocolSha256": "d0ffd5a1bd5ad3ef6e62ff0881307f47fe0030511e0eb87170cb7b0a19640957",
    "recordFieldsSha256": "6fbcb5a123ee58a041110c7fa2115e99418842fe3cdd7df55959b0bed89adfe1",
    "recordFields": [
      "图物对应与实际装盒",
      "尺移出后的盒内和旧勾",
      "复核更改与原话"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c2b8b419e4b0a4acc0d8e2302900fbf04b4ff46e552336d13023d5c92d9524f4"
    }
  },
  "93:7-9:v1": {
    "protocolSha256": "13261f14dbb9c3a4943611767218b246064002c728cf83d32d57da8a704e98d7",
    "recordFieldsSha256": "1e97b61b867ebf9bce4db8081b2ebee539b77f7e878f7bf987bc9fee45662052",
    "recordFields": [
      "V1勾选及真实盒内",
      "R对V1的漏写与实物差异",
      "V2五项需求对应",
      "第二轮装盒与练习限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c2b8b419e4b0a4acc0d8e2302900fbf04b4ff46e552336d13023d5c92d9524f4"
    }
  },
  "93:10-12:v1": {
    "protocolSha256": "bab627dd7ef02f261a48118937d6aff9c45709e49063a31445c59e9dbec9704a",
    "recordFieldsSha256": "df10362a49cc65c7fefc112e5c50c57e0d4b91aecd9807d070e3caba3868778d",
    "recordFields": [
      "每轮参与者/条件/次序",
      "需求查看与提示/中止",
      "五必需品实际在盒状态",
      "两额外物状态与计数",
      "逐人N/L配对与限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c2b8b419e4b0a4acc0d8e2302900fbf04b4ff46e552336d13023d5c92d9524f4"
    }
  },
  "93:13-16:v1": {
    "protocolSha256": "275804f9820f84d47ecb846cf3c0481b44b143aee768a62eaabea6426e157632",
    "recordFieldsSha256": "322ad544bb13aee290d5d0f68095a73c40e7733242f56d6c5574dbd9382a3fb5",
    "recordFields": [
      "V1/V2/V3人数与规则",
      "每版需求数量与盒内实数",
      "补入/取出差量",
      "旧勾为何不能直接继承",
      "未完成与模型边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "c2b8b419e4b0a4acc0d8e2302900fbf04b4ff46e552336d13023d5c92d9524f4"
    }
  },
  "123:4-6:v1": {
    "protocolSha256": "de45f77848257e11ceed0826ad1c13672853dddfe16b35c7791fdae08f991036",
    "recordFieldsSha256": "3776d72334e89d671b8ef82d560b08ef1b4df1ee2f0b07690c4a62aa16721460",
    "recordFields": [
      "盐粒搅拌前后可见性",
      "S/W各2毫升开始状态",
      "每天实际时间与液面/残留",
      "清水空白是否也有残留",
      "未见/未完成或污染",
      "成人帮助与结束清理"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0a4df41ef971dfc4f275e33f3c4db94cd3d60cf0e576c2a9fa012e3b8effa269"
    }
  },
  "123:7-9:v1": {
    "protocolSha256": "804af44e34a8530f04fcb9a3d1fa2cf6e59035ea05f235ea0dab13dc1f5188fc",
    "recordFieldsSha256": "a2fe22331583da27ac20b80a6c9c71812a716eceb2c32958281471e749d4593d",
    "recordFields": [
      "A/B实际内径高度",
      "同批各10毫升分装",
      "实际时间及液层状态",
      "各盘残留位置/异常",
      "面积比与实际尺寸",
      "容器组合的共同变化",
      "未完成与清理"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0a4df41ef971dfc4f275e33f3c4db94cd3d60cf0e576c2a9fa012e3b8effa269"
    }
  },
  "123:10-12:v1": {
    "protocolSha256": "c636dc1bc63c7ff5332945f10824b5c901c07d08dce57e214580d225c7edcd51",
    "recordFieldsSha256": "27271b29fcc1dcfc4b1c57ab27e5be3202f9d34aa965d609b826ea4d99b1aa8a",
    "recordFields": [
      "三盘皮重与0.1克分辨率",
      "实际s/w与f",
      "A/B/C实际p及M0",
      "逐次Mt与实际小时",
      "液层/残留和损失异常",
      "M0−Mt及规范化值",
      "小残留工具限制",
      "截止状态与清理"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0a4df41ef971dfc4f275e33f3c4db94cd3d60cf0e576c2a9fa012e3b8effa269"
    }
  },
  "123:13-16:v2": {
    "protocolSha256": "52a814110ef3f50924ee4c17e68d779056d73682996471efd348344c9cae4ad4",
    "recordFieldsSha256": "d2678f4ac39a2fe3d9221630ac076058aa14dfb6a5c94a6960312a980022eb2a",
    "recordFields": [
      "T、实际s/w/f与p/q",
      "清水空白实际投料",
      "各次含盘质量和时间",
      "末三读数间隔与绝对差",
      "液层/污染/洒出异常",
      "表观r及r/q、A/B差异",
      "空白与复溶实际观察",
      "未完成和非纯度结论"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0a4df41ef971dfc4f275e33f3c4db94cd3d60cf0e576c2a9fa012e3b8effa269"
    }
  },
  "254:4-6:v1": {
    "protocolSha256": "eb3b3e0045899e47b426ae5118bf6774f8be3f3e535bfef0ea738a87a8e0f319",
    "recordFieldsSha256": "296ddade7270af17f058b6295ab0254fb184758a48094c8e91aae69b84fdf11e",
    "recordFields": [
      "布局/任务/端点",
      "各次行程与单位",
      "实际读数/帮助/未知",
      "比较资格与限制",
      "下一步设计"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "1d60613d86263fe5143975b8830d875777865660e3477833c730925aebd94084"
    }
  },
  "254:7-9:v1": {
    "protocolSha256": "6baa20c52e7f307530d3fb9fec5653881c0d3a1ed0f7462bda876c942c023eb9",
    "recordFieldsSha256": "296ddade7270af17f058b6295ab0254fb184758a48094c8e91aae69b84fdf11e",
    "recordFields": [
      "布局/任务/端点",
      "各次行程与单位",
      "实际读数/帮助/未知",
      "比较资格与限制",
      "下一步设计"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "1d60613d86263fe5143975b8830d875777865660e3477833c730925aebd94084"
    }
  },
  "254:10-12:v1": {
    "protocolSha256": "bd4ab33c3524325a5fb207a8f55a2e7dd4385d0a7114a301ad779b04707d44f6",
    "recordFieldsSha256": "296ddade7270af17f058b6295ab0254fb184758a48094c8e91aae69b84fdf11e",
    "recordFields": [
      "布局/任务/端点",
      "各次行程与单位",
      "实际读数/帮助/未知",
      "比较资格与限制",
      "下一步设计"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "1d60613d86263fe5143975b8830d875777865660e3477833c730925aebd94084"
    }
  },
  "254:13-16:v1": {
    "protocolSha256": "9ed91576408671d63b14381f77289e47b7553dbe322c924f62e9f5283a635ce7",
    "recordFieldsSha256": "296ddade7270af17f058b6295ab0254fb184758a48094c8e91aae69b84fdf11e",
    "recordFields": [
      "布局/任务/端点",
      "各次行程与单位",
      "实际读数/帮助/未知",
      "比较资格与限制",
      "下一步设计"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "1d60613d86263fe5143975b8830d875777865660e3477833c730925aebd94084"
    }
  },
  "268:4-6:v1": {
    "protocolSha256": "de9a1d6b50369d6d928d4400d355063b4be0eb8136ff5bd23834483b878a5ec5",
    "recordFieldsSha256": "605fa9f276fb6cf130c13ba7c5dc385bdf57d9465eece07c2e4cbaa13d1e4568",
    "recordFields": [
      "起始位置/量杯读数",
      "干基线/重置污染",
      "原话或N/V/?/X",
      "偏移/未知/成人帮助",
      "观察与因果边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "83d3071742b49f4f77db7d006c54e5d74f79d43619edda2e62a42e3d20270616"
    }
  },
  "268:7-9:v1": {
    "protocolSha256": "e405487a2bb8590fd0bc44aa17e8c68dd6338d9acf9d17d97789a9f6c47c4f03",
    "recordFieldsSha256": "605fa9f276fb6cf130c13ba7c5dc385bdf57d9465eece07c2e4cbaa13d1e4568",
    "recordFields": [
      "起始位置/量杯读数",
      "干基线/重置污染",
      "原话或N/V/?/X",
      "偏移/未知/成人帮助",
      "观察与因果边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "83d3071742b49f4f77db7d006c54e5d74f79d43619edda2e62a42e3d20270616"
    }
  },
  "268:10-12:v1": {
    "protocolSha256": "0010345dcb7a9aa2660993d7f1d39549deab926dcd57128d14e502c753465555",
    "recordFieldsSha256": "605fa9f276fb6cf130c13ba7c5dc385bdf57d9465eece07c2e4cbaa13d1e4568",
    "recordFields": [
      "起始位置/量杯读数",
      "干基线/重置污染",
      "原话或N/V/?/X",
      "偏移/未知/成人帮助",
      "观察与因果边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "83d3071742b49f4f77db7d006c54e5d74f79d43619edda2e62a42e3d20270616"
    }
  },
  "268:13-16:v1": {
    "protocolSha256": "a2b694b3b88212d3c5be29163e3dd3fc61d3784cb435c86c43103aac803355ae",
    "recordFieldsSha256": "605fa9f276fb6cf130c13ba7c5dc385bdf57d9465eece07c2e4cbaa13d1e4568",
    "recordFields": [
      "起始位置/量杯读数",
      "干基线/重置污染",
      "原话或N/V/?/X",
      "偏移/未知/成人帮助",
      "观察与因果边界"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "83d3071742b49f4f77db7d006c54e5d74f79d43619edda2e62a42e3d20270616"
    }
  },
  "221:4-6:v1": {
    "protocolSha256": "69be3452ef286972b3e2054f361b42ad5ed0dac70f22357be2d056fae8c659b2",
    "recordFieldsSha256": "2d5a0629347f5d7da2c7a35b363fe6a21c1ad0e519f6c1d05a31a52298bca599",
    "recordFields": [
      "白1实际描述",
      "蓝实际描述",
      "白2实际描述",
      "相同/不同/不确定",
      "反光/帮助/未做"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b8c128ab873cb0b1ebb07f421426d6a3c32722e0c0555cddd4e64bb1e9b6a000"
    }
  },
  "221:7-9:v1": {
    "protocolSha256": "cea9fed520e247b5ee4d89d6989df11a7228dea55701afaeee2092abf29c692c",
    "recordFieldsSha256": "a7924a9a7258bc87d758e4ab42ea92eba1dd82fff6db585c0c6084bdfe4111d1",
    "recordFields": [
      "轮次与背景",
      "S/W和左右位置",
      "两杯实际描述",
      "换位后比较",
      "回白两条读数",
      "反光/帮助/缺失",
      "有效观察数"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b8c128ab873cb0b1ebb07f421426d6a3c32722e0c0555cddd4e64bb1e9b6a000"
    }
  },
  "221:13-16:v1": {
    "protocolSha256": "1725ffcf674a66ad872a9f2a83b99d0f53d60c6be57a1a3947693382021f2868",
    "recordFieldsSha256": "0f9e648218e83b6801faef0076d4e2909e546aa6bae27f426323859adfa9251e",
    "recordFields": [
      "轮次/代码/背景",
      "相对R实际判断",
      "配方与20毫升核查",
      "各组合有效n及四类计数",
      "缺失/反光/帮助",
      "最终回白2条",
      "名义比例与限制",
      "顺序和重复观察说明"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b8c128ab873cb0b1ebb07f421426d6a3c32722e0c0555cddd4e64bb1e9b6a000"
    }
  },
  "228:4-6:v1": {
    "protocolSha256": "b6c7fba6c0b82dc09fdb8111109fec4604e523a29cfa532a1481898585f36f1e",
    "recordFieldsSha256": "01b8bef51ebc4240e0aaad47908256fb8e20262607a8f9bcb126cd93a793fe8a",
    "recordFields": [
      "杯全名与图形",
      "加I前色貌原话",
      "加I后色貌原话",
      "两杯实际观察时间",
      "标签是否一直完整",
      "帮助/未做/停止原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "5a5a3bc69262dee195c572c150c1e7297a4cdc32741bf12c643dcc0d7e832c9a"
    }
  },
  "228:7-9:v1": {
    "protocolSha256": "1d34ba6237645909ba2253e4f061ece548558e4a3e32ef632e745de4fc94e872",
    "recordFieldsSha256": "f52fe6ca70ba60222de22a460897a48ab300e698a55ec358a8a6b98cbcec667d",
    "recordFields": [
      "四杯ID与来源分样表",
      "初始四杯位置",
      "各杯原色/60秒色貌",
      "实际时刻与加入顺序",
      "两对复样相同/不同",
      "真实换位后的位置图",
      "时间偏差/标签问题/停止"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "5a5a3bc69262dee195c572c150c1e7297a4cdc32741bf12c643dcc0d7e832c9a"
    }
  },
  "228:10-12:v1": {
    "protocolSha256": "33bb1991b5effededc9a14bcedccd72d2047a59c6f7c0ee3341d5a3584c435d9",
    "recordFieldsSha256": "012db879580db59ba78d4e26340fd202f6d30098dceab9b8b4e69c53109fa619",
    "recordFields": [
      "五杯完整来源与加入物",
      "糖水配方/溶清/实际余量",
      "五杯原样色貌",
      "WB/SB真实空白色貌与时刻",
      "WI/SI/VI色貌与时刻",
      "水糖可分辨性和VI响应",
      "不能推出的身份/pH/浓度",
      "误差/未做/停止"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "5a5a3bc69262dee195c572c150c1e7297a4cdc32741bf12c643dcc0d7e832c9a"
    }
  },
  "228:13-16:v1": {
    "protocolSha256": "078b04f0c584a535c27ea1c8d885e01e800b7ee3c3cb04fab459da488a275b10",
    "recordFieldsSha256": "3495f3f09484a952d4a36e0a40af8974edb39f41395b8be491f2090979d37331",
    "recordFields": [
      "原来源配方及成人编码表",
      "标签/纸罩/实际分样核对",
      "七杯t0/读时/色貌",
      "四K揭示前候选集合及理由",
      "揭示后的真身份与包含关系",
      "含糊/无法判断/偏离数",
      "泄露线索/时间或混样偏差",
      "停止/未做及方法限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "5a5a3bc69262dee195c572c150c1e7297a4cdc32741bf12c643dcc0d7e832c9a"
    }
  },
  "101:4-6:v1": {
    "protocolSha256": "4f5bedad667a3c2940cd5f9c4e9ab6524612660be7879dea5912266343e3f6a1",
    "recordFieldsSha256": "7521c9dbb77adcdfc7e3cd71c698b26e07ba34d929e97dae7426d430d34ee8c8",
    "recordFields": [
      "空尺点及是否适用",
      "左右6厘米检查",
      "四次摆法与实际先低侧",
      "碰触/滑动/成人帮助"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "fb92e83b1e719d3cb31f43331f4b6f7289131ad0a562774281c59d0d695a03e7"
    }
  },
  "101:7-9:v1": {
    "protocolSha256": "1820fa309a546adfca81768e2b32f15f99229325f6f09051e826bc45df11ad9e",
    "recordFieldsSha256": "fb4d4257e09589b350202ca7a7287dbcc35a0cd0ae0e8ba37bbc58eb067d9f09",
    "recordFields": [
      "c₀和三个中心标记",
      "六次物品/位置/结果",
      "回基线是否一致",
      "滑动/碰触/看不清",
      "趋势与不能倍推的量"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "fb92e83b1e719d3cb31f43331f4b6f7289131ad0a562774281c59d0d695a03e7"
    }
  },
  "101:10-12:v1": {
    "protocolSha256": "0e7bbcac633c985fa0bc457682774210fcb345d6908365817040ed6794ab09e4",
    "recordFieldsSha256": "d0c2c90936a0bfcd9b721bf9e09b9973f7e4eefa4405d90b2f6cd905ed0126c6",
    "recordFields": [
      "三块质量/分度/近等条件",
      "c₀与实际8/4/3/5距离",
      "六轮状态与安全停止",
      "左右质量×距离及单位",
      "叠块偏心和不敏感限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "fb92e83b1e719d3cb31f43331f4b6f7289131ad0a562774281c59d0d695a03e7"
    }
  },
  "101:13-16:v1": {
    "protocolSha256": "8f2e6527dcc3b78c55f796ed03725413d22c49ba4236ea9d7720db4e7d380022",
    "recordFieldsSha256": "430c92b390303789c705134156c7c5b920c2aea1ae5f247398c0d59e3c7b3cc0",
    "recordFields": [
      "M/mA/mB及材料条件",
      "c₀/p₀/p₁/顶带宽",
      "d₀/d₁计算与位置核查",
      "四条件各两次实际状态",
      "含尺自重方程及单位",
      "恢复基线/误差/无法区分"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "fb92e83b1e719d3cb31f43331f4b6f7289131ad0a562774281c59d0d695a03e7"
    }
  },
  "102:4-6:v1": {
    "protocolSha256": "ecc5e0ce33749a3da2718482f11eba959305c7c2bb280a2f2151221d1ddac39a",
    "recordFieldsSha256": "f33ceba604731f66fbdcd8a688557d72103bb422c49705562c7e03cf8f2f024a",
    "recordFields": [
      "初始完整片数4",
      "三个位置完整片数",
      "碎片/粘杯/无法对应",
      "水是否流到下杯",
      "成人帮助与破纸漏流"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed078ad3a6d74a58a538f11ad732c477c64207b17d7b87b96f46c76cbe2b664a"
    }
  },
  "102:7-9:v1": {
    "protocolSha256": "121e7fd4eb9ea85d3f8f735c676474203411881698bcceeada64302904df5e8b",
    "recordFieldsSha256": "2b33f710f340120535166a7a2218c9d18a0e2916a4a8b4c2f274e539d075d3c2",
    "recordFields": [
      "四份配方与原样标签",
      "筛编号/有无纸/先后",
      "是否全倒及失效",
      "结束后同静置2分钟",
      "可见颗粒类别",
      "颜色单列",
      "两轮是否一致与局限"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed078ad3a6d74a58a538f11ad732c477c64207b17d7b87b96f46c76cbe2b664a"
    }
  },
  "102:10-12:v1": {
    "protocolSha256": "0abad44641bc165a1fb19a43b8b4816cd0c01e8722f645cab5e1a97cbaad918f",
    "recordFieldsSha256": "2578cddd8d018bf2a6596e26f5a84c6b4aad9257811365c06f3711bafd6fcb32",
    "recordFields": [
      "W/WP/S/SP身份和各2毫升",
      "无可见晶粒及滤液是否足量",
      "取样器专用/先水后盐",
      "开始与72小时截止",
      "各次干燥与污染情况",
      "终点残留与双空白",
      "未完成/证据不足/结论限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed078ad3a6d74a58a538f11ad732c477c64207b17d7b87b96f46c76cbe2b664a"
    }
  },
  "102:13-16:v1": {
    "protocolSha256": "de06eae34019cf337036fe24c7037f014ed194e074b7b8b65232c92839fe24ba",
    "recordFieldsSha256": "271d05620e18fd0f661426d38317b515e0f7a81b549c72d43c7bd75c926227ed",
    "recordFields": [
      "条件/纸层/顺序与纸张数",
      "总水50毫升/咖啡量匙",
      "倒完时刻与读数分度",
      "V60和V120原读数",
      "两段平均收集速率",
      "静置颗粒/颜色分列",
      "异常、重复范围及解释限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed078ad3a6d74a58a538f11ad732c477c64207b17d7b87b96f46c76cbe2b664a"
    }
  },
  "108:4-6:v1": {
    "protocolSha256": "fb80c01a1db33ac6f488b29d68146635455885b0135065e0e13b4577c682db66",
    "recordFieldsSha256": "79178c4f29e97e32b87088099e39e791ad0fb88aeef14e1a475166ac6b4f30c8",
    "recordFields": [
      "空尺适用与质量近等",
      "近/远/近三次实际状态",
      "手碰/滑动/接盘/帮助",
      "同块位置与质量的区别"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b20dd610e9222a767d3e97404360984f17a172488914d607d690793ebe954665"
    }
  },
  "108:7-9:v1": {
    "protocolSha256": "b2fa518477db76cc3655968af89600c384bf74734e6dae2f1a9b012d14c5dd8d",
    "recordFieldsSha256": "5078b7fefda28042d04d716b63939410bffc8ee559d025b916f47301960d47a4",
    "recordFields": [
      "c₀/质量/六个中心点",
      "六次扫描真实状态",
      "采用的复核分支及3次状态",
      "是否找到转变/未明确",
      "不确定、碰触和安全停止"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b20dd610e9222a767d3e97404360984f17a172488914d607d690793ebe954665"
    }
  },
  "108:10-12:v1": {
    "protocolSha256": "a172ff236115a8ea7cd0d220de2cde6209915de3dd3e45fafc415e2cdf590c2a",
    "recordFieldsSha256": "7dac8fa25dd02d20ef368af1c882a6b7edb3cd74b2b196b3d4d7bf37cafc59f2",
    "recordFields": [
      "质量/预测d及先遮住",
      "3/9端点实际状态",
      "各L/R/m及观察/更新理由",
      "停止条件与末区间",
      "预测比较和装置误差"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b20dd610e9222a767d3e97404360984f17a172488914d607d690793ebe954665"
    }
  },
  "108:13-16:v1": {
    "protocolSha256": "98d589473e0c2f4449bdf81794c1bc69b7d6364dad45d05dc44e1407fac93d2b",
    "recordFieldsSha256": "8cf4acf40b36c13de5fa74465ce4f22f04f4c889a6b301774639da47acc38a4b",
    "recordFields": [
      "成人筛选/封存说明",
      "R质量/c₀/顶宽",
      "两配置最多10次原始观察",
      "两区间和模型质量范围",
      "U再称/初称及分度",
      "重叠/不符/共享误差与用途限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b20dd610e9222a767d3e97404360984f17a172488914d607d690793ebe954665"
    }
  },
  "116:4-6:v1": {
    "protocolSha256": "aa1640f85bb19a59e33cc1114439a1ed17727e00901aeec49016e274a0d577ba",
    "recordFieldsSha256": "a409a42ec5c81b93840b2ca2c852cb13c5dbde6027a7046fba40515cc3b1590d",
    "recordFields": [
      "A一张/B两张检查",
      "两次实际倾倒时间",
      "60秒是否出水",
      "同型杯实际水位比较",
      "明显倾倒差异/渗漏/帮助",
      "清水试验不能说明什么"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0f6601fa55884e77471884a7095cf808aea6bafd835044e44c74bf6d8668344b"
    }
  },
  "116:7-9:v1": {
    "protocolSha256": "596e1a2e81934616e4e7ebb502e5f869b5cc2474105179c224e4c2711f2ad186",
    "recordFieldsSha256": "ffb233f9cff94b000bbc95a71a4659d174579f7376937b46141d51137727f021",
    "recordFields": [
      "两组8片与40毫升检查",
      "实际搅拌/倾倒/截止时刻",
      "各180秒收集量",
      "源杯/滤纸/接液完整片数",
      "破碎/不明/渗漏记录",
      "两个指标与一次比较限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0f6601fa55884e77471884a7095cf808aea6bafd835044e44c74bf6d8668344b"
    }
  },
  "116:10-12:v1": {
    "protocolSha256": "d8a2c3b178238b74467b84936ba5836c46e5263254831437be6718ff86285d87",
    "recordFieldsSha256": "5ba18156cb1fb14091a96214c521213f24d4b411237f7bdbe7a4312b80576331",
    "recordFields": [
      "A/B纸层数与干初态",
      "各次倾倒/第一滴时间",
      "四杯120秒体积或缺测",
      "两次间等待与无滴判据",
      "A2−A1/B2−B1（适用时）",
      "残留水/连续处理/读量限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0f6601fa55884e77471884a7095cf808aea6bafd835044e44c74bf6d8668344b"
    }
  },
  "116:13-16:v1": {
    "protocolSha256": "57aab7f49b1aa586d4788a305db8b51e7ee483e2fb4a25d427f822589cb45e73",
    "recordFieldsSha256": "687769416287412d102b1d44bc8d4a520ab8773d956b89f45e80b0fb3f1a7333",
    "recordFields": [
      "6次方案/顺序/装置/配制时刻",
      "各次实际投料和第一过体积",
      "C中间量/第二过量/转移时间",
      "各流程总时间与最终量/60",
      "等10毫升视觉记录或不足",
      "两轮差异/破纸绕流与缺测",
      "多指标权衡及不能外推之处"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "0f6601fa55884e77471884a7095cf808aea6bafd835044e44c74bf6d8668344b"
    }
  },
  "129:7-9:v1": {
    "protocolSha256": "75a8bda251e14c427a00c5a9375a924ae8406e7cb8c5a26961a4fbdd6becb623",
    "recordFieldsSha256": "2aa39441e0b8f4091bdbf4eb477229d1f6bf398999d1bdf5daa31adc0886d815",
    "recordFields": [
      "支点/左实际中心/三站位置",
      "六次顺序和右实际中心",
      "原地重放两次结果",
      "向内两次结果",
      "向外两次结果",
      "每次基线/端卡/成人帮助",
      "扶碰滑移停止与解释"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "48afc784dd84d77cdbe7c848038d413ee4d9f78dfe4f267a94509b43690f597b"
    }
  },
  "129:10-12:v1": {
    "protocolSha256": "4deae3461bbcb242b40564785c421e3d9fe02306d7595a69ab8180e91c5c4d50",
    "recordFieldsSha256": "f55b60ca1c6fad994ac77486ccc587f4005ab2fe0fed9e058e279341809f5c32",
    "recordFields": [
      "mL/mR/mr/秤分度",
      "xL0/右22/顶宽/基线检查",
      "四段实际右位移与初始结果",
      "逐格左中心及实际方向",
      "各段可见补偿范围/边界是否找到",
      "质量比预测与实际范围比较",
      "1/2/2/1重复差异",
      "扶碰/中心偏差/停止与未测项"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "48afc784dd84d77cdbe7c848038d413ee4d9f78dfe4f267a94509b43690f597b"
    }
  },
  "129:13-16:v1": {
    "protocolSha256": "9c6d888880931cf1bcb72a7c1c62c4bfac37c0ee2401a8b2de41e0d166d59faa",
    "recordFieldsSha256": "73a9a3be4a85e4fa10f81a8e93d5499f1b1d5446b13610874a73f65a766beb14",
    "recordFields": [
      "mL/mR/mr/M及秤分度",
      "bA/bB/高度/材质/表面/尺寸分度",
      "两顶xR0和每轮基线检查",
      "A顶18次实际中心/方向/异常",
      "B顶18次实际中心/方向/异常",
      "各顺序a/b/L/U或未夹全",
      "表观宽区间与W模型范围",
      "摆位/窗口/释放限制和结论"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "48afc784dd84d77cdbe7c848038d413ee4d9f78dfe4f267a94509b43690f597b"
    }
  },
  "130:7-9:v1": {
    "protocolSha256": "0e1259459ba76f555e3fdbee66e716d0a3e9c4c7caa2ee388ad3b3899bb3630f",
    "recordFieldsSha256": "a214065adc00b86e1e658ed4fe84dd278a39904dde042a3360d33daae6e3934d",
    "recordFields": [
      "过滤过程与异常",
      "F/B实际来源及2毫升",
      "开始日期时刻",
      "每日各盘液层/残留",
      "两盘外观异同",
      "未干/污染与终止",
      "小样不代表全量回收"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed3e5875569ba286248f357496ca2f7eb4c974c238efa2916222f904e8289ffe"
    }
  },
  "130:10-12:v1": {
    "protocolSha256": "6e7df1f5fdebd0d7ee7fad570487e29930db5170b622e4247dc9c3ed6021f263",
    "recordFieldsSha256": "1d8af60f1d679869ea0ad3d6aceba6d08733fdccea0a67c6a8ff4a6b53014125",
    "recordFields": [
      "A/B实称和湿砂说明",
      "整份路线与转移损失",
      "滤纸与接杯身份",
      "每日液层和可辨砂",
      "144小时是否完成等待",
      "B复溶再滤是否执行",
      "追加水量与步骤时长",
      "为何不比干速/纯盐产率"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed3e5875569ba286248f357496ca2f7eb4c974c238efa2916222f904e8289ffe"
    }
  },
  "130:13-16:v1": {
    "protocolSha256": "2c018ec3eb08d17324c66b94109a3c1dcd7915f8239f3343d2492beda7c0ad75",
    "recordFieldsSha256": "f7a65fa816bad036c4359194fa4b37197977591ded047e258f7876bd33d64b54",
    "recordFields": [
      "四盘T、实际盐s及投入水",
      "F/W1/W2换杯与120秒",
      "各段转移损失/破纸/洒漏",
      "每日M与真实时间",
      "无液层与末三读数判据",
      "各合条件q及B背景",
      "合条件才算表观残留比",
      "一份样本/湿砂水/纯度限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "ed3e5875569ba286248f357496ca2f7eb4c974c238efa2916222f904e8289ffe"
    }
  },
  "66:7-9:v1": {
    "protocolSha256": "2114dc6d4a43ae9e30a6bbfac7a4ff015e7cba834b298e982bb6bd5ea57132d3",
    "recordFieldsSha256": "ef4557545a21f5b0eb5597ac9696b0a151be67cc177b1e46bc7bce937f36bc77",
    "recordFields": [
      "盒尺寸/质量和两姿态",
      "读高基线h₀与检查",
      "A/B稳定级/首发区间/类型",
      "上限、无效及不能比较原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "bae959e9acf94709fef63db24ca19f647f57d73dbb8c6d86cab361918583db49"
    }
  },
  "66:10-12:v1": {
    "protocolSha256": "74091a57d99795e8226a5bf4c2bb115225c9068774a89dca0b7daeedfeaa8c93",
    "recordFieldsSha256": "921381dfb409ff10cb8a0c728b1046567ef4715954afc9fca9009bc17eb939ba",
    "recordFields": [
      "固定底面与P/Q沿坡尺寸",
      "六次顺序及重置/损伤检查",
      "首发区间和类型/上限/缺测",
      "同类重复比较及样本限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "bae959e9acf94709fef63db24ca19f647f57d73dbb8c6d86cab361918583db49"
    }
  },
  "66:13-16:v1": {
    "protocolSha256": "e61f20c96f807b30998cbea6c1ae3f7bc63901ddef5373d27717daa98708ebb5",
    "recordFieldsSha256": "035d5bb0462117346baf23604f272cba56d310b85510658b499adbbaaf8d701a",
    "recordFields": [
      "四条件方向与表面检查/h₀",
      "8次顺序与盒/表面状态",
      "首发区间/类型/上限/缺测",
      "同类比较和先滑删失限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "bae959e9acf94709fef63db24ca19f647f57d73dbb8c6d86cab361918583db49"
    }
  },
  "73:4-6:v1": {
    "protocolSha256": "b2c8d744b42c25a5a211e8f69f8943affbf739b5396f63546a162924e47172a6",
    "recordFieldsSha256": "857139d3e3cbcfb86c92e74c7b68eb0cb596da0b8e9bb604eb2361ab38429399",
    "recordFields": [
      "低/高/低三个安装位置",
      "每次站住/动了/不清",
      "若动了，成人记事件类型"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "a0ed4e8de6666a7b2998a4ab8fbb5a57eef9a7d7fb3dc12269542b536e9e0ce4"
    }
  },
  "73:7-9:v1": {
    "protocolSha256": "907c1a78b2a32c8d7a30ce652a48eba9b931ebd1d34b7de98b8eb2344532d9d0",
    "recordFieldsSha256": "b53df38f360579032fffef2548a6dfe6e10dda588c0188fce8aa2aba99524b83",
    "recordFields": [
      "两次配重高度与闭盒总质量",
      "h0与最后稳定级",
      "首发目标级/类型或至8未见",
      "可比与不可比的理由"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "a0ed4e8de6666a7b2998a4ab8fbb5a57eef9a7d7fb3dc12269542b536e9e0ce4"
    }
  },
  "73:10-12:v1": {
    "protocolSha256": "3bd223d9fc6d1f84b9f7cef887e41b049736a83b7adf702c3134d77e795142c5",
    "recordFieldsSha256": "dc4cd5278572615618c4d980cacff5081c7d04967b6cea6293f9eaa0a76c40f8",
    "recordFields": [
      "六次顺序及安装高度",
      "每次总质量、h0与固定检查",
      "首发区间/类型或未见",
      "各位置两轮是否同类且区间重叠"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "a0ed4e8de6666a7b2998a4ab8fbb5a57eef9a7d7fb3dc12269542b536e9e0ce4"
    }
  },
  "73:13-16:v1": {
    "protocolSha256": "59de963298c74804f8f9a5e6610d34cfd68111a48c247940201f7d217bde6e84",
    "recordFieldsSha256": "c05ee87dbaa7d75a578b49af93f925b34f280dbc87c47bc63a67b115ed754f49",
    "recordFields": [
      "M/m与每次闭盒质量",
      "8次条件、安装高度、h0",
      "首发区间和事件类型或未见",
      "同方向高度比较、同高度方向比较",
      "质量加权变化量与模型偏差"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "a0ed4e8de6666a7b2998a4ab8fbb5a57eef9a7d7fb3dc12269542b536e9e0ce4"
    }
  },
  "80:4-6:v1": {
    "protocolSha256": "389d857a88caef9146586f549eaf06a37ea15d8f9816b47e68d9168bb0aa8be8",
    "recordFieldsSha256": "d27f977363d5b54c2ce12f6861be788bfd73f97a439dbecbcf9e7c78207fab9f",
    "recordFields": [
      "裸塔是否可平立",
      "裸塔与宽脚在小坡的真实表现",
      "两个轮廓与同时改变的材料"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "e155c531230c61d90091bad7afb21c210bd52709dbaf2cd85eed761752b61825"
    }
  },
  "80:7-9:v1": {
    "protocolSha256": "d1c57d78d40170e9d41f4c0e54080dc9fd64b0338ff9d3d8ff6c7f76bf4c6182",
    "recordFieldsSha256": "feaac3041f1b5c434b2ed7b571db472c4895bc9b3845468a9c00260f7c02f5dc",
    "recordFields": [
      "脚实际8/3厘米近似尺寸与塔高",
      "L/T最后稳定级与首发目标级",
      "事件类型、未见或无效",
      "旋转前后支承轮廓与坡向"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "e155c531230c61d90091bad7afb21c210bd52709dbaf2cd85eed761752b61825"
    }
  },
  "80:10-12:v1": {
    "protocolSha256": "e4f41e600258f5f6cb01a3864202c161e1cb8cb6579be3ca9e3a415fd263a0ca",
    "recordFieldsSha256": "2ee9c20b2f9d8273cfc266d8c43f3e8c2398b29be733832398765cee223d3903",
    "recordFields": [
      "三脚实际尺寸与面积",
      "六次顺序、朝向与重装偏差",
      "各次首发区间/类型或未见",
      "重复区间与结构变化",
      "等面积没有控制住的因素"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "e155c531230c61d90091bad7afb21c210bd52709dbaf2cd85eed761752b61825"
    }
  },
  "80:13-16:v1": {
    "protocolSha256": "40e2803c68f658511cde9386ff565b37fec3e9539a8dd50ff8851bcf1bda2e1a",
    "recordFieldsSha256": "0615f7b75238db04d3a25a1683f2d650715856784467d3338b6eb1826bdf461f",
    "recordFields": [
      "a/b及方向定位误差",
      "六次顺序、区间、事件类型",
      "三方向有效重复对照",
      "中心射线d与投影宽图",
      "模型条件及不满足证据"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "e155c531230c61d90091bad7afb21c210bd52709dbaf2cd85eed761752b61825"
    }
  },
  "87:4-6:v1": {
    "protocolSha256": "27a83e986e68dd9dbb601b3bcfb33b32e4a680b124524ce496536a0e59f2d7ee",
    "recordFieldsSha256": "bcf10fb3d024680049b7293728a75ba7826759371d57a9212e5b8f8ad423159f",
    "recordFields": [
      "A/B/C各次结果",
      "提前倾斜方向或看不清",
      "操作者和辅助情况"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "8c99adb91f7cfe349b64a4aa75cb8c0c752bfdab1095e4b2bb5fdc22a320180f"
    }
  },
  "87:7-9:v1": {
    "protocolSha256": "23676884a3b88d6fab479880872cbff6bd648f60cd7653249d41dd6672d58d8b",
    "recordFieldsSha256": "f48c1c48c947e27bf4b53b837b088ba307b0b758e2d3b2eeac8f1da17ec69da0",
    "recordFields": [
      "四点原板结果",
      "四点加片结果",
      "取下后中心结果",
      "胶带与板形变化",
      "无效或偏离操作"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "8c99adb91f7cfe349b64a4aa75cb8c0c752bfdab1095e4b2bb5fdc22a320180f"
    }
  },
  "87:10-12:v1": {
    "protocolSha256": "9c5dd750047d448f18b56fed9ef49c223411b04cd4a717bed391f6009de400c1",
    "recordFieldsSha256": "ba2d56bdac1392f60729f0b82b4251d892ac17431e21c8acc74d1f93bbe83cf6",
    "recordFields": [
      "两片实测几何尺寸",
      "面积与模型候选坐标",
      "R九点结果",
      "L九点结果",
      "定位精度与无效原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "8c99adb91f7cfe349b64a4aa75cb8c0c752bfdab1095e4b2bb5fdc22a320180f"
    }
  },
  "87:13-16:v1": {
    "protocolSha256": "ad1910c2c989656423d74400a5c598f9c5311098193694e5428d65c9766d45ee",
    "recordFieldsSha256": "5971b66ce8a87b33978bbbcaee0a115f079e613e2052f86123506e3c6271d4a8",
    "recordFields": [
      "L实量与模型计算",
      "P两次结果",
      "PQ两次结果",
      "RS两次结果",
      "接触区与支承范围图",
      "等高/弯曲/辅助等偏差"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "8c99adb91f7cfe349b64a4aa75cb8c0c752bfdab1095e4b2bb5fdc22a320180f"
    }
  },
  "88:4-6:v1": {
    "protocolSha256": "19cb846f3314f2a7b5a457c3261a68d4d94a4f530d740a8c9b302deed452be08",
    "recordFieldsSha256": "afcd781a7425a18d4b7ff39298b65dbd73a691da97af69c88a2b0eee4b5aa76b",
    "recordFields": [
      "水量与糖平勺份量",
      "开始和2分钟可见类别",
      "六卡前后计数",
      "修改了哪种误导画法"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "81b05629f06abba53b2f5144c1aced0504f83ba0c41564c4beccb7fd2bfb0775"
    }
  },
  "88:7-9:v1": {
    "protocolSha256": "e911ffd720df7619c8ec55306c2b0a7d84779af7042b48cbdc569d57288f9bb2",
    "recordFieldsSha256": "41d6f710598cc209233ceb7959ff926ab54133f53f9025e8df4137394ee4cad5",
    "recordFields": [
      "A/B初始配料",
      "初始两杯可见类别",
      "各补水量与第二阶段类别",
      "四框糖符号数",
      "操作偏差与模型局限"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "81b05629f06abba53b2f5144c1aced0504f83ba0c41564c4beccb7fd2bfb0775"
    }
  },
  "88:10-12:v1": {
    "protocolSha256": "e35cda74a22dd191d7b078b5209b17a55d58630bc5b72a44f5af3c70ca44234c",
    "recordFieldsSha256": "59588f1184acb58398279b936144c8ec145fa247aa25f2af526c5c63980782be",
    "recordFields": [
      "水量/糖实际投入",
      "秤分度与称量集合",
      "M0三个原始读数",
      "M1三个原始读数",
      "两个显示范围及差值分度",
      "底部可见类别与漏迹",
      "模型计数和两条局限"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "81b05629f06abba53b2f5144c1aced0504f83ba0c41564c4beccb7fd2bfb0775"
    }
  },
  "88:13-16:v1": {
    "protocolSha256": "717eadd6575dccd6d785964de0f0ad67691c5f2d6e486a94c4be986d8fc5bceb",
    "recordFieldsSha256": "488b472ad9d6d45deefed0c433d0c67f7f237fdc88fa369f3234113bf9fd273f",
    "recordFields": [
      "A/B实际水和糖质量",
      "T0/T1/T2完整总质量",
      "A实加水a和U0",
      "两阶段可见类别",
      "A/B配方分数与分母",
      "四框同类符号计数",
      "开盖/残滴/读数等偏差"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "81b05629f06abba53b2f5144c1aced0504f83ba0c41564c4beccb7fd2bfb0775"
    }
  },
  "159:4-6:v1": {
    "protocolSha256": "c93a00436811a1c73af7aab41194a0fe221101fcbf8f0518dd2b24c2bcaff886",
    "recordFieldsSha256": "847de60692fc7bea93518faf0c448a3d6b84287b6bc8a13d77778e773bfbfd35",
    "recordFields": [
      "成人复核物件条件",
      "d条端点重合检查",
      "绕量是否斜缠或滑动",
      "第一次三段拼接与端点比较",
      "拆开后第二次比较",
      "差不清或偏差原因"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "6b36317f45ed30a05f0cd106705aba1c3e886a9f7e0617e50aa8301fc5aa24a7"
    }
  },
  "159:7-9:v1": {
    "protocolSha256": "c787fe4ab6e71092c26737af19703f4a667396fbee99c3fb7ef03e753513877b",
    "recordFieldsSha256": "213ec458dd6c62f10b3b00e293fb1e04fac72c48cb6dbdf6d3c5f33da7c01765",
    "recordFields": [
      "A/B两方向实际d毫米值",
      "d选用及异常复查",
      "A1/A2/B1/B2实际C",
      "三倍长度的加法和标尺",
      "各物重复差",
      "四次C−3d与差不清标记",
      "实测与理想关系的区别"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "6b36317f45ed30a05f0cd106705aba1c3e886a9f7e0617e50aa8301fc5aa24a7"
    }
  },
  "159:10-12:v1": {
    "protocolSha256": "1c373d752926a9b559567d9169064b37a47d14f93ca48a40f591da3abe0c0395",
    "recordFieldsSha256": "7a644ca0b3181f5bae6e872120dbf75ae303508ad9b1c877c0e84337bdd73551",
    "recordFields": [
      "三物材料条件与编号",
      "九个方向跨度与极差",
      "各物d中位数及适用性",
      "九次C与起止/异常",
      "九个C/d计算值",
      "各物中位数与范围/散点",
      "缺测和重做编号",
      "偏差解释与未证明事项"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "6b36317f45ed30a05f0cd106705aba1c3e886a9f7e0617e50aa8301fc5aa24a7"
    }
  },
  "159:13-16:v1": {
    "protocolSha256": "8bef7e3bd8bdeb4692641bfc6ea35fe458d40950b53e4f7e5dbea5d77f0a3b0a",
    "recordFieldsSha256": "8ad436e6c6bff9d488dc22625bc1fe5f7051c8d67bbee9e657beeb6d703d084e",
    "recordFields": [
      "材料与三方向d/中位数",
      "三条独立纸带C",
      "六次圈数/x0/xN/LN",
      "滑动偏移/倾倒/数圈异常",
      "补测编号及缺测",
      "各LN/N与比值",
      "端点敏感性区间和固定d假设",
      "实际重复差及方法限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "6b36317f45ed30a05f0cd106705aba1c3e886a9f7e0617e50aa8301fc5aa24a7"
    }
  },
  "194:4-6:v1": {
    "protocolSha256": "a6afd614c1aee5e4e96d37f790942ab29b91ecf2e8746f179e67614dd6bee615",
    "recordFieldsSha256": "831dd2687c28d0677a43ba1a7f10ca7e8d450782cf5b077e62c2560793c82bcb",
    "recordFields": [
      "原角顶点与固定位置",
      "未遮时叠合所见",
      "近挡片后叠合所见",
      "远挡片后叠合所见",
      "揭开后与纸滑动/不清限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b53896dbced2513982befb797881813099df7e2f80c705fc975f18cc753e5c3c"
    }
  },
  "194:7-9:v1": {
    "protocolSha256": "1f24bae7c863e2f2c1976ba7beb3e062e53ef2676ed41bc358a7c20bb3ba4fb9",
    "recordFieldsSha256": "c2a457b85ee74067aad9eb26cac9723e2cfa3f92b28b58afd7a25d17d3a9868e",
    "recordFields": [
      "三张卡身份/目标后揭示",
      "外观初判及理由",
      "透明描A质量",
      "B叠合定位和第二边所见",
      "C叠合定位和第二边所见",
      "回A复位与误差",
      "初判改变/未改变及证据"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b53896dbced2513982befb797881813099df7e2f80c705fc975f18cc753e5c3c"
    }
  },
  "194:10-12:v1": {
    "protocolSha256": "ece8dd0fd438fb1471f32d194ebe1e58520123c1ca853a50012fd5f4b4e38838",
    "recordFieldsSha256": "07e9664228b61272fe0a6b889f95bd2b091685c4ffe88e1d8b7219b4638287cb",
    "recordFields": [
      "角卡与预制目标后揭示",
      "原线长与中心/零圈规则",
      "延长前两次读数或读不出",
      "原端点与延长直线质量",
      "四短卡延长后两读或缺测",
      "A组/B组叠合所见",
      "目标差异/读错圈/手画限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b53896dbced2513982befb797881813099df7e2f80c705fc975f18cc753e5c3c"
    }
  },
  "194:13-16:v1": {
    "protocolSha256": "8eb3df9b28353eb33f0d4f56523a237184950848e764690f3e6363226161003f",
    "recordFieldsSha256": "b2e92bf5308d2b28c084f99e9c5a52f93599fe77be2770ecc9fff2363fd7e7f6",
    "recordFields": [
      "目标圆与三弧身份/纸形缺陷",
      "小大半径各3读",
      "九次贴弧顺序/原读/有效性",
      "有效次数/均值/原范围",
      "P与Q的弧长和s每r比较",
      "P与R的弧度及可选度换算",
      "理论对照与手工系统误差"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "b53896dbced2513982befb797881813099df7e2f80c705fc975f18cc753e5c3c"
    }
  },
  "125:10-12:v1": {
    "protocolSha256": "03470f88e5559ee91349ecb085c2f8e1197df16f7b72248bbca78eaaf9709fee",
    "recordFieldsSha256": "fefc749809081a9f2ac92b0f587919cac85cf8a46260583d950e38ab244dd854",
    "recordFields": [
      "各样本来源与t0",
      "E浸泡结束/处置时间",
      "轻分成功或停止原因",
      "E实际可见结构/未辨",
      "来源结构参考另栏",
      "I1/I2/K每日真实变化",
      "不同个体证据的限制",
      "正式盒最终处置"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "82949ceca00b9b02c4047c6e7ed23e460591b61f9431fc0220932dae6b9539d1"
    }
  },
  "178:7-9:v1": {
    "protocolSha256": "328441c31e7eead0fc25587de963ec3f01f5398cab2bdebafb0d06b8b018908a",
    "recordFieldsSha256": "0ed508087213fb3e7adffdd831521f35d3edfa5cffffc65fdef813b6cd2de291",
    "recordFields": [
      "两纸实长宽与计算面积",
      "六次顺序/释放高度检查",
      "每次落稳x/y至1cm",
      "格外/越桌/中心遮挡",
      "下垂/先滑/迟放异常",
      "可见转动或看不清",
      "位置定义及比较限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "3a55a335afb848484a44cf5030db976726b5faf47546f3657e1799130767d361"
    }
  },
  "178:10-12:v1": {
    "protocolSha256": "254a4c56ca22faf27e23db251f61949b80f941319142817daf0867a58e3a4edc",
    "recordFieldsSha256": "2576392ae4b7c81b4ca92cfded7a6dfdebf4017bad715a28d6ba4d98290a51d0",
    "recordFields": [
      "四片原始长宽与编号",
      "两槽实宽/高/回弹",
      "8次顺序与释放异常",
      "首离手u/首触桌v及d",
      "两事件相邻帧间隔",
      "可见姿态/遮挡/计时不可用",
      "同片重复与同构型两件差",
      "最低点与质心高度限制"
    ],
    "source": {
      "dataset": "curriculum-rebuilt-integrated1200-safety-20261106/dist/data.json",
      "datasetSha256": "595b4c385189689d0cf3665af615ec11e5ef615ef02faf73ae682657c1abb040",
      "dayAssetSha256": "3a55a335afb848484a44cf5030db976726b5faf47546f3657e1799130767d361"
    }
  },
  "178:13-16:v1": {
    "protocolSha256": "ca924de8747cf1d981f79e46782eee4c26b4959c6208b6f2b3ea6ba55748ef33",
    "recordFieldsSha256": "712e2ad49506c62a6485abb35eca209f4e25864c6874f4464a2d5e89344bdded",
    "recordFields": [
      "纸实长宽/中心与可达性",
      "12次预设条件和实做情况",
      "竖态上下缘目标及高度核对",
      "R0/R1/L0/L1四拍摄时刻",
      "每次T下/T上",
      "迟放/形变/遮挡/越桌/缺测",
      "四条件三次区间与包络",
      "重叠判断及质心/接触限制"
    ],
    "source": {
      "dataset": "338-topic baseline/dist/data.json",
      "datasetSha256": "f6302e0ba3028e5783961f9ea5ecb55d69c4a1fe45e4963dcdf0f80380c48dd7",
      "dayAssetSha256": "90569b1cf432a76c1227e08f4edaf408c2d65954d55f2739a4b856e37259dd9f"
    }
  }
}).map(([key,schema])=>[key,Object.freeze({...schema,source:Object.freeze(schema.source),recordFields:Object.freeze(schema.recordFields)})])));
export const historicalRecordSchema=({day,age,version})=>schemas[`${day}:${age}:v${version}`]||null;
