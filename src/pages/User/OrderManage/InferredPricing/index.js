
import React from 'react';
import './index.less'

// TikTok Shop地区数据
const tiktokRegions = [
  { id: 'US', name: '美国', currency: 'USD', symbol: '$' },
  { id: 'JP', name: '日本', currency: 'JPY', symbol: '¥' },
  { id: 'MX', name: '墨西哥', currency: 'MXN', symbol: '$' },
  { id: 'BR', name: '巴西', currency: 'BRL', symbol: 'R$' },
  { id: 'TH', name: '泰国', currency: 'THB', symbol: '฿' },
  { id: 'ID', name: '印尼', currency: 'IDR', symbol: 'Rp' },
  { id: 'SG', name: '新加坡', currency: 'SGD', symbol: 'S$' },
  { id: 'VN', name: '越南', currency: 'VND', symbol: '₫' },
  { id: 'PH', name: '菲律宾', currency: 'PHP', symbol: '₱' },
  { id: 'MY', name: '马来西亚', currency: 'MYR', symbol: 'RM' },
  // 欧洲地区
  { id: 'UK', name: '英国', currency: 'GBP', symbol: '£' },
  { id: 'DE', name: '德国', currency: 'EUR', symbol: '€' },
  { id: 'FR', name: '法国', currency: 'EUR', symbol: '€' },
  { id: 'IT', name: '意大利', currency: 'EUR', symbol: '€' },
  { id: 'ES', name: '西班牙', currency: 'EUR', symbol: '€' }
];
const shippingConfig = require('./kuaidi.json')

class InferredPricing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 基础状态
      selectedRegion: 'US',
      exchangeRate: 1,
      isLoading: false,
      lastUpdated: '',
shippingFormula: '', // 运费计算公式
    shopType: 'local', // 'local' 或 'crossBorder'
    packageSize: 'small', // 'small' 或 'large'
    cargoType: '030', // 货物类型ID
    packageWeight: 0, // 包裹重量(kg)
    calculatedShippingCost: 0, // 计算出的运费
       smallPackageCost: 0,
      // 平台费用相关状态
      platformCommission: 5, // 平台佣金率（%）
      influencerCommission: 10, // 达人佣金率（%）
      processingFee: 2, // 手续费（%）
      sfpFee: 0, // SFP费率（%）
      taxRate: 0, // 消费税率（%）
      otherFee: 0, // 其他费用（%）
      discountRate: 0, // 平台折扣率（%）

      // 商品成本相关状态
      procurementCost: 0, // 采购成本（人民币）
      shippingCost: 0, // 头程运费（人民币）
      forwardingCost: 0, // 货代费用（人民币）
      tailShippingCost: 0, // 尾程运费（人民币）
      packagingCost: 0, // 包材成本（人民币）
      returnRate: 5, // 退货率（百分比）

      // 其他费用
      withdrawalRate: 1.2, // 提现费率（百分比）
      profitMargin: 20, // 利润率（百分比）

      promotionRate: 0, // 新增推广费率状态
      // 计算结果
      calculatedPrice: 0, // 计算出的定价（当地货币）
      calculationDetails: null // 计算详情
    };
  }

  // 获取当前地区信息
  get currentRegion() {
    const foundRegion = tiktokRegions.find(region => region.id === this.state.selectedRegion);
    return foundRegion ? foundRegion : tiktokRegions[0];
  }

  // 组件挂载时加载数据
  componentDidMount() {
    this.loadData();
      this.updateShippingCost(); // 添加这行
  }

// 加载数据（从localStorage获取，新增推广费率加载）
loadData = () => {
  const savedData = localStorage.getItem('tiktokPricingData');
  if (savedData) {
    const data = JSON.parse(savedData);
    this.setState({
      selectedRegion: data.selectedRegion || 'US',
      platformCommission: data.platformCommission || 5,
      influencerCommission: data.influencerCommission || 10,
      promotionRate: data.promotionRate || 0, // 加载推广费率
      processingFee: data.processingFee || 2,
      sfpFee: data.sfpFee || 0,
      taxRate: data.taxRate || 0,
      otherFee: data.otherFee || 0,
      discountRate: data.discountRate || 0,
      procurementCost: data.procurementCost || 0,
      shippingCost: data.shippingCost || 0,
      forwardingCost: data.forwardingCost || 0,
      tailShippingCost: data.tailShippingCost || 0,
      packagingCost: data.packagingCost || 0,
      returnRate: data.returnRate || 5,
      withdrawalRate: data.withdrawalRate || 1.2,
      profitMargin: data.profitMargin || 20
    }, () => {
      // 加载完成后获取汇率
      this.fetchExchangeRate(this.state.selectedRegion);
    });
  } else {
    // 没有保存的数据，使用默认值获取汇率
    this.fetchExchangeRate('US');
  }
}



  // 保存数据到localStorage（新增推广费率保存）
saveData = (data) => {
  const currentData = JSON.parse(localStorage.getItem('tiktokPricingData') || '{}');
  const updatedData = { ...currentData, ...data };
  localStorage.setItem('tiktokPricingData', JSON.stringify(updatedData));
}
// 重置所有数据（新增推广费率重置）
resetAllData = () => {
  this.setState({
    selectedRegion: 'US',
    platformCommission: 5,
    influencerCommission: 10,
    promotionRate: 0, // 重置推广费率
    processingFee: 2,
    sfpFee: 0,
    taxRate: 0,
    otherFee: 0,
    discountRate: 0,
    procurementCost: 0,
    shippingCost: 0,
    forwardingCost: 0,
    tailShippingCost: 0,
    packagingCost: 0,
    returnRate: 5,
    withdrawalRate: 1.2,
    profitMargin: 20,
    calculatedPrice: 0,
    calculationDetails: null
  }, () => {
    localStorage.removeItem('tiktokPricingData');
    this.fetchExchangeRate('US');
  });
}

  // 获取实时汇率
  fetchExchangeRate = async (regionCode = 'US') => {
    this.setState({ isLoading: true });
    try {
      // 使用免费的汇率API
      const baseCurrency = 'CNY';
      // 修复可选链语法问题
      const region = tiktokRegions.find(r => r.id === regionCode);
      const targetCurrency = region ? region.currency : 'USD';

      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);

      if (!response.ok) throw new Error('汇率查询失败');

      const data = await response.json();
      const targetRate = data.rates[targetCurrency];

      this.setState({
        exchangeRate: targetRate,
        lastUpdated: new Date().toLocaleString()
      });

    } catch (error) {
      console.error('获取汇率失败:', error);
      // 使用默认汇率
      const defaultRates = {
        'US': 0.14, 'JP': 15.5, 'MX': 2.5, 'BR': 0.75,
        'TH': 4.8, 'ID': 2150, 'SG': 0.19, 'VN': 3400,
        'PH': 8.0, 'MY': 0.65,
        'UK': 0.11, 'DE': 0.13, 'FR': 0.13, 'IT': 0.13, 'ES': 0.13
      };
      this.setState({
        exchangeRate: defaultRates[regionCode] || 0.14,
        lastUpdated: '本地缓存 ' + new Date().toLocaleString()
      });
    } finally {
      this.setState({ isLoading: false });
    }
  }


  // 计算小件运费
calculateSmallPackageShipping = () => {
  const { selectedRegion, cargoType, packageWeight } = this.state;
  
  // 获取当前地区的运费配置
  const regionConfig = shippingConfig.find(region => region.id === selectedRegion);
  if (!regionConfig) return { cost: 0, formula: '' };
  
  // 获取货物类型的运费规则
  const cargoConfig = regionConfig.children.find(item => item.id === cargoType);
  if (!cargoConfig) return { cost: 0, formula: '' };
  
  try {
    const feeRules = JSON.parse(cargoConfig.fee);
    
    // 找到适用的运费规则
    const applicableRule = feeRules.find(rule => 
      packageWeight >= rule.min && packageWeight < rule.max
    );
    
    if (applicableRule) {
      const cost = applicableRule.perParcel + (applicableRule.perKg * packageWeight);
      const formula = `${applicableRule.perParcel} + ${applicableRule.perKg} × ${packageWeight}`;
      return { cost, formula };
    }
    
    return { cost: 0, formula: '' };
  } catch (error) {
    console.error('解析运费规则失败:', error);
    return { cost: 0, formula: '' };
  }
}

// 更新运费计算
// 修改 updateShippingCost 方法
// 修改 updateShippingCost 方法
// 修改 updateShippingCost 方法
updateShippingCost = () => {
  const { selectedRegion, shopType, packageSize, forwardingCost, shippingCost, tailShippingCost, exchangeRate } = this.state;
  
  const isSpecialRegion = ['JP', 'UK', 'DE', 'FR', 'IT', 'ES'].includes(selectedRegion);
  
  if (isSpecialRegion && shopType === 'crossBorder' && packageSize === 'small') {
    // 跨境小件模式：计算特殊运费（不包含货代）
    const { cost, formula } = this.calculateSmallPackageShipping();
    const forwardingCostLocal = forwardingCost * exchangeRate; // 货代费用转换为当地货币
    const totalCost = forwardingCostLocal + cost;
    
    this.setState({ 
      calculatedShippingCost: totalCost, // 总运费 = 货代 + 小件运费
      shippingFormula: formula, // 包裹设置只显示特殊运费公式
      smallPackageCost: cost // 保存小件运费（不包含货代）
    });
  } else {
    // 本土店铺或大件模式：所有运费总和（CNY）转换为当地货币
    const totalCostCNY = Number(forwardingCost) + Number(shippingCost) + Number(tailShippingCost);
    const totalCostLocal = totalCostCNY * exchangeRate;
    
    this.setState({ 
      calculatedShippingCost: totalCostLocal,
      shippingFormula: '',
      smallPackageCost: 0
    });
  }
}


// 处理店铺类型变化
handleShopTypeChange = (e) => {
  const shopType = e.target.value;
  this.setState({ shopType }, () => {
    this.saveData({ shopType });
    // 切换店铺类型时重置运费相关字段
    if (shopType === 'crossBorder') {
      this.setState({
        shippingCost: 0,
        tailShippingCost: 0
      }, () => {
        this.updateShippingCost();
      });
    } else {
      this.updateShippingCost();
    }
  });
}

// 处理包裹大小变化
handlePackageSizeChange = (e) => {
  const packageSize = e.target.value;
  this.setState({ packageSize }, () => {
    this.saveData({ packageSize });
    // 切换包裹大小时重置运费
    if (packageSize === 'small') {
      this.setState({
        shippingCost: 0,
        tailShippingCost: 0
      }, () => {
        this.updateShippingCost();
      });
    } else {
      this.updateShippingCost();
    }
  });
}

// 处理货物类型变化
handleCargoTypeChange = (e) => {
  const cargoType = e.target.value;
  this.setState({ cargoType }, () => {
    this.saveData({ cargoType });
    this.updateShippingCost();
  });
}

// 处理包裹重量变化
handlePackageWeightChange = (e) => {
  const packageWeight = parseFloat(e.target.value) || 0;
  this.setState({ packageWeight }, () => {
    this.saveData({ packageWeight });
    this.updateShippingCost();
  });
}
  // 手动更新汇率
  refreshRate = () => {
    this.fetchExchangeRate(this.state.selectedRegion);
  }

  // 处理地区变化
  handleRegionChange = (e) => {
    const region = e.target.value;
    this.setState({ selectedRegion: region }, () => {
      this.saveData({ selectedRegion: region });
      this.fetchExchangeRate(region);
          this.updateShippingCost(); // 添加这行
    });
  }



  // 处理平台费用变化
  handlePlatformCommissionChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ platformCommission: value });
    this.saveData({ platformCommission: value });
  }


  
  handleInfluencerCommissionChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ influencerCommission: value });
    this.saveData({ influencerCommission: value });
  }

  handleProcessingFeeChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ processingFee: value });
    this.saveData({ processingFee: value });
  }

  handleSfpFeeChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ sfpFee: value });
    this.saveData({ sfpFee: value });
  }

  handleTaxRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ taxRate: value });
    this.saveData({ taxRate: value });
  }

  handleOtherFeeChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ otherFee: value });
    this.saveData({ otherFee: value });
  }

  handleDiscountRateChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    this.setState({ discountRate: value });
    this.saveData({ discountRate: value });
  }

  // 处理推广费率变化
handlePromotionRateChange = (e) => {
  const value = parseFloat(e.target.value) || 0;
  this.setState({ promotionRate: value });
  this.saveData({ promotionRate: value });
}


  // 处理成本变化
  handleProcurementCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ procurementCost: cost });
    this.saveData({ procurementCost: cost });
  }

 handleForwardingCostChange = (e) => {
  const cost = parseFloat(e.target.value) || 0;
  this.setState({ forwardingCost: cost }, () => {
    this.saveData({ forwardingCost: cost });
    this.updateShippingCost(); // 添加这行
  });
}

handleShippingCostChange = (e) => {
  const cost = parseFloat(e.target.value) || 0;
  this.setState({ shippingCost: cost }, () => {
    this.saveData({ shippingCost: cost });
    this.updateShippingCost(); // 添加这行
  });
}

handleTailShippingCostChange = (e) => {
  const cost = parseFloat(e.target.value) || 0;
  this.setState({ tailShippingCost: cost }, () => {
    this.saveData({ tailShippingCost: cost });
    this.updateShippingCost(); // 添加这行
  });
}

  handleReturnRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    this.setState({ returnRate: rate });
    this.saveData({ returnRate: rate });
  }

  handlePackagingCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ packagingCost: cost });
    this.saveData({ packagingCost: cost });
  }

  // 处理其他费用变化
  handleWithdrawalRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    this.setState({ withdrawalRate: rate });
    this.saveData({ withdrawalRate: rate });
  }

  handleProfitMarginChange = (e) => {
    const margin = parseFloat(e.target.value) || 0;
    this.setState({ profitMargin: margin });
    this.saveData({ profitMargin: margin });
  }

  // 计算定价函数
calculatePricing = () => {
  const { selectedRegion, shopType, packageSize, exchangeRate } = this.state;
  
  let shippingCostCNY = 0;
  const isSpecialRegion = ['JP', 'UK', 'DE', 'FR', 'IT', 'ES'].includes(selectedRegion);
  const isSpecialShipping = isSpecialRegion && shopType === 'crossBorder' && packageSize === 'small';
  
  if (isSpecialShipping) {
    // 跨境小件模式：将当地货币运费转换回CNY
    shippingCostCNY = this.state.calculatedShippingCost / exchangeRate;
  } else {
    // 常规模式：直接使用输入的CNY运费
    shippingCostCNY = this.state.forwardingCost + this.state.shippingCost + this.state.tailShippingCost;
  }
  
  // 计算总成本（人民币）
  const totalCostCNY = this.state.procurementCost + this.state.packagingCost + shippingCostCNY;

  // 转换为当地货币成本（关键：所有成本统一为当地货币，与销售价单位一致）
  const procurementCostLocal = this.state.procurementCost * this.state.exchangeRate;
  const packagingCostLocal = this.state.packagingCost * this.state.exchangeRate;
  const forwardingCostLocal = this.state.forwardingCost * this.state.exchangeRate;
  const shippingCostLocal = this.state.shippingCost * this.state.exchangeRate;
  const tailShippingCostLocal = this.state.tailShippingCost * this.state.exchangeRate;
  const totalCostLocal = totalCostCNY * this.state.exchangeRate;

  // 计算总费率（包含推广费率）
  const totalFeeRate = (this.state.platformCommission + this.state.influencerCommission + 
                       this.state.processingFee + this.state.sfpFee + this.state.taxRate + 
                       this.state.otherFee + this.state.discountRate + this.state.promotionRate) / 100;

  // 目标利润率（基于成本）
  const targetProfitMargin = this.state.profitMargin / 100;

  // 退货率
  const returnRateValue = this.state.returnRate / 100;

  // 核心：计算建议销售价（当地货币）
  const denominator = (1 - totalFeeRate) * (1 - returnRateValue) * (1 - this.state.withdrawalRate/100);
  const requiredRevenue = totalCostLocal * (1 + targetProfitMargin) / denominator;

  // 计算各项费用明细
  const platformCommissionFee = requiredRevenue * (this.state.platformCommission / 100);
  const influencerCommissionFee = requiredRevenue * (this.state.influencerCommission / 100);
  const promotionFee = requiredRevenue * (this.state.promotionRate / 100);
  const processingFeeAmount = requiredRevenue * (this.state.processingFee / 100);
  const sfpFeeAmount = requiredRevenue * (this.state.sfpFee / 100);
  const taxAmount = requiredRevenue * (this.state.taxRate / 100);
  const otherFeeAmount = requiredRevenue * (this.state.otherFee / 100);
  const discountAmount = requiredRevenue * (this.state.discountRate / 100);

  // 扣除平台费用后的金额（不考虑退货）
  const amountAfterPlatformFees = requiredRevenue - platformCommissionFee - influencerCommissionFee - promotionFee -
                                 processingFeeAmount - sfpFeeAmount - taxAmount - otherFeeAmount - discountAmount;
  
  // 有效销售额（考虑退货）
  const effectiveSales = amountAfterPlatformFees * (1 - returnRateValue);
  
  // 提现费用
  const withdrawalFee = effectiveSales * (this.state.withdrawalRate / 100);
  
  // 实际到账金额
  const actualReceivedAmount = effectiveSales - withdrawalFee;
  
  // 总费用
  const totalFees = platformCommissionFee + influencerCommissionFee + promotionFee +
                   processingFeeAmount + sfpFeeAmount + taxAmount + otherFeeAmount + withdrawalFee + discountAmount;

  // 退货损失
  const returnLoss = requiredRevenue * returnRateValue;

  // 净利润
  const netProfit = actualReceivedAmount - totalCostLocal;

  // ROI计算
  const salePrice = requiredRevenue; // 销售价格（当地货币）
  const logisticsCost = shippingCostLocal + tailShippingCostLocal; // 物流成本=头程+尾程
  const freightForwarderCost = forwardingCostLocal; // 货代费用
  const productCost = procurementCostLocal + packagingCostLocal; // 商品成本=采购+包材
  const roi = salePrice === 0 
    ? 0 
    : ((salePrice - logisticsCost - freightForwarderCost - productCost) / salePrice) * 100;

  // 净利润率（基于成本）
  const netProfitMargin = totalCostLocal === 0 ? 0 : (netProfit / totalCostLocal) * 100;

  // 设置计算结果
  this.setState({
    calculatedPrice: requiredRevenue,
    calculationDetails: {
      totalCostCNY,
      totalCostLocal,
      procurementCost: this.state.procurementCost,
      procurementCostLocal,
      packagingCost: this.state.packagingCost,
      packagingCostLocal,
      forwardingCost: this.state.forwardingCost,
      forwardingCostLocal,
      shippingCost: this.state.shippingCost,
      shippingCostLocal,
      tailShippingCost: this.state.tailShippingCost,
      tailShippingCostLocal,
      isSpecialShipping, // 添加标识
      specialShippingCost: isSpecialShipping ? shippingCostCNY : 0, // 特殊运费CNY
      specialShippingCostLocal: isSpecialShipping ? this.state.calculatedShippingCost : 0, // 特殊运费当地货币
      platformCommissionFee,
      influencerCommissionFee,
      promotionFee,
      processingFeeAmount,
      sfpFeeAmount,
      taxAmount,
      otherFeeAmount,
      discountAmount,
      withdrawalFee,
      totalFees,
      returnLoss,
      netProfit,
      roi,
      requiredRevenue,
      returnRate: returnRateValue,
      netProfitMargin,
      actualReceivedAmount,
      targetProfitMargin: targetProfitMargin * 100,
      amountAfterPlatformFees,
      effectiveSales,
      calculationType: 'price'
    }
  });
}

// 保存数据到localStorage（新增推广费率保存）
saveData = (data) => {
  const currentData = JSON.parse(localStorage.getItem('tiktokPricingData') || '{}');
  const updatedData = { ...currentData, ...data };
  localStorage.setItem('tiktokPricingData', JSON.stringify(updatedData));
}

// 加载数据（从localStorage获取，新增推广费率加载）
loadData = () => {
  const savedData = localStorage.getItem('tiktokPricingData');
  if (savedData) {
    const data = JSON.parse(savedData);
    this.setState({
      selectedRegion: data.selectedRegion || 'US',
      platformCommission: data.platformCommission || 5,
      influencerCommission: data.influencerCommission || 10,
      promotionRate: data.promotionRate || 0, // 加载推广费率
      processingFee: data.processingFee || 2,
      sfpFee: data.sfpFee || 0,
      taxRate: data.taxRate || 0,
      otherFee: data.otherFee || 0,
      discountRate: data.discountRate || 0,
      procurementCost: data.procurementCost || 0,
      shippingCost: data.shippingCost || 0,
      forwardingCost: data.forwardingCost || 0,
      tailShippingCost: data.tailShippingCost || 0,
      packagingCost: data.packagingCost || 0,
      returnRate: data.returnRate || 5,
      withdrawalRate: data.withdrawalRate || 1.2,
      profitMargin: data.profitMargin || 20
    }, () => {
      // 加载完成后获取汇率
      this.fetchExchangeRate(this.state.selectedRegion);
    });
  } else {
    // 没有保存的数据，使用默认值获取汇率
    this.fetchExchangeRate('US');
  }
}

// 重置所有数据（新增推广费率重置）
resetAllData = () => {
  this.setState({
    selectedRegion: 'US',
    platformCommission: 5,
    influencerCommission: 10,
    promotionRate: 0, // 重置推广费率
    processingFee: 2,
    sfpFee: 0,
    taxRate: 0,
    otherFee: 0,
    discountRate: 0,
    procurementCost: 0,
    shippingCost: 0,
    forwardingCost: 0,
    tailShippingCost: 0,
    packagingCost: 0,
    returnRate: 5,
    withdrawalRate: 1.2,
    profitMargin: 20,
    calculatedPrice: 0,
    calculationDetails: null
  }, () => {
    localStorage.removeItem('tiktokPricingData');
    this.fetchExchangeRate('US');
  });
}

  render() {
    const { 
      isLoading, 
      lastUpdated, 
      calculatedPrice,
      calculationDetails
    } = this.state;
    const region = this.currentRegion;
const showRegularShipping = 
  this.state.shopType !== 'crossBorder' || 
  this.state.packageSize !== 'small' || 
  !['JP', 'UK', 'DE', 'FR', 'IT', 'ES'].includes(this.state.selectedRegion);
    return (
      <main className="tiktok-calculator">
        <div className="calculator-header">
          <h3 className="titleName">TikTok Shop定价计算器</h3>
          <button 
            className="reset-btn" 
            onClick={this.resetAllData} 
            title="重置所有数据"
          >
            重置
          </button>
        </div>

        <div className="calculator-content">
          {/* 地区和汇率部分 */}
          <div className="section-card">
            <h4 className="section-title">地区与汇率设置</h4>
            <div className="region-rate-container">
              <div className="region-selector">
                <label>选择TikTok Shop地区</label>
                <select
                  value={this.state.selectedRegion}
                  onChange={this.handleRegionChange}
                  className="region-dropdown"
                >
                  {tiktokRegions.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.name} ({region.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="rate-display">
                <label>人民币兑换{region.currency}的汇率</label>
                <div className="rate-input-container">
                  <input
                    type="number"
                    value={this.state.exchangeRate.toFixed(4)}
                    readOnly
                    className="rate-input"
                  />
                  <button
                    onClick={this.refreshRate}
                    disabled={isLoading}
                    className="refresh-btn"
                    title="更新汇率"
                  >
                    {isLoading ? '🔄' : '↻'}
                  </button>
                </div>
                {lastUpdated && (
                  <div className="rate-info">
                    <small>更新时间: {lastUpdated}</small>
                    <br />
                    <small>1 CNY = {this.state.exchangeRate.toFixed(4)} {region.currency}</small>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* // 在地区和汇率部分之后添加店铺类型选择 */}
<div className="section-card">
  <h4 className="section-title">店铺类型</h4>
  <div className="shop-type-selector">
    <label>
      <input
        type="radio"
        value="local"
        checked={this.state.shopType === 'local'}
        onChange={this.handleShopTypeChange}
      />
      本土店铺
    </label>
    <label>
      <input
        type="radio"
        value="crossBorder"
        checked={this.state.shopType === 'crossBorder'}
        onChange={this.handleShopTypeChange}
      />
      跨境店铺
    </label>
  </div>
</div>

{/* // 在店铺类型之后添加包裹设置（仅对特定地区显示） */}
{['JP', 'UK', 'DE', 'FR', 'IT', 'ES'].includes(this.state.selectedRegion) && 
 this.state.shopType === 'crossBorder' && (
  <div className="section-card">
    <h4 className="section-title">包裹设置</h4>
    <div className="package-settings">
      <div className="package-size-selector">
        <label>包裹大小</label>
        <select
          value={this.state.packageSize}
          onChange={this.handlePackageSizeChange}
        >
          <option value="small">小件</option>
          <option value="large">大件</option>
        </select>
      </div>

      {this.state.packageSize === 'small' && (
        <div className="small-package-details">
          <div className="cargo-type-selector">
            <label>货物类型</label>
            <select
              value={this.state.cargoType}
              onChange={this.handleCargoTypeChange}
            >
            {(shippingConfig.find(region => region.id === this.state.selectedRegion) || { children: [] })
            .children.map(type => (
                <option key={type.id} value={type.id}>
                {type.styleName}
                </option>
            ))}
            </select>
          </div>

<div className="weight-input">
  <label>包裹重量 (kg)</label>
  <input
    type="number"
    value={this.state.packageWeight}
    onChange={this.handlePackageWeightChange}
    min="0"
    step="0.1"
    placeholder="输入重量"
  />
  {this.state.smallPackageCost > 0 && this.state.shippingFormula && (
    <div className="shipping-formula-display">
      <span className="formula">
        {this.state.shippingFormula} = {this.state.smallPackageCost.toFixed(2)} {this.currentRegion.currency}
      </span>
    </div>
  )}
</div>
        </div>
      )}
    </div>
  </div>
)}

          {/* 平台费用部分 */}
<div className="section-card">
  <h4 className="section-title">平台费用设置</h4>
  <div className="platform-fees-grid">
    <div className="fee-input">
      <label>平台佣金率 (%)</label>
      <input
        type="number"
        value={this.state.platformCommission}
        onChange={this.handlePlatformCommissionChange}
        min="0"
        max="50"
        step="0.1"
        className="fee-input-field"
      />
    </div>

    <div className="fee-input">
      <label>达人佣金率 (%)</label>
      <input
        type="number"
        value={this.state.influencerCommission}
        onChange={this.handleInfluencerCommissionChange}
        min="0"
        max="50"
        step="0.1"
        className="fee-input-field"
      />
    </div>

    <div className="fee-input">
      <label>推广费率 (%)</label>
      <input
        type="number"
        value={this.state.promotionRate}
        onChange={this.handlePromotionRateChange}
        min="0"
        max="50"
        step="0.1"
        className="fee-input-field"
      />
    </div>

    <div className="fee-input">
      <label>平台折扣率 (%)</label>
      <input
        type="number"
        value={this.state.discountRate}
        onChange={this.handleDiscountRateChange}
        min="0"
        max="100"
        step="0.1"
        className="fee-input-field"
      />
      <small className="help-text">平台促销活动折扣</small>
    </div>

    <div className="fee-input">
      <label>手续费 (%)</label>
      <input
        type="number"
        value={this.state.processingFee}
        onChange={this.handleProcessingFeeChange}
        min="0"
        max="10"
        step="0.1"
        className="fee-input-field"
      />
    </div>

    <div className="fee-input">
      <label>SFP费率 (%)</label>
      <input
        type="number"
        value={this.state.sfpFee}
        onChange={this.handleSfpFeeChange}
        min="0"
        max="10"
        step="0.1"
        className="fee-input-field"
      />
    </div>

    <div className="fee-input">
      <label>消费税率 (%)</label>
      <input
        type="number"
        value={this.state.taxRate}
        onChange={this.handleTaxRateChange}
        min="0"
        max="30"
        step="0.1"
        className="fee-input-field"
      />
    </div>

    <div className="fee-input">
      <label>其他费用 (%)</label>
      <input
        type="number"
        value={this.state.otherFee}
        onChange={this.handleOtherFeeChange}
        min="0"
        max="30"
        step="0.1"
        className="fee-input-field"
      />
      <small className="help-text">其他平台相关费用</small>
    </div>
  </div>
</div>

          {/* 商品成本部分 */}
          <div className="section-card">
            <h4 className="section-title">商品成本信息</h4>
            <div className="cost-inputs-grid">
              <div className="cost-input">
                <label>采购成本 (CNY)</label>
                <div className="currency-input-container">
                  <input
                    type="number"
                    value={this.state.procurementCost}
                    onChange={this.handleProcurementCostChange}
                    min="0"
                    step="0.01"
                    className="cost-input-field"
                    placeholder="采购成本"
                  />
                  <span className="currency-conversion">
                    ≈ {(this.state.procurementCost * this.state.exchangeRate).toFixed(2)} {region.currency}
                  </span>
                </div>
              </div>

              <div className="cost-input">
                <label>包材成本 (CNY)</label>
                <div className="currency-input-container">
                  <input
                    type="number"
                    value={this.state.packagingCost}
                    onChange={this.handlePackagingCostChange}
                    min="0"
                    step="0.01"
                    className="cost-input-field"
                    placeholder="包材成本"
                  />
                  <span className="currency-conversion">
                    ≈ {(this.state.packagingCost * this.state.exchangeRate).toFixed(2)} {region.currency}
                  </span>
                </div>
              </div>

              <div className="cost-input">
                <label>退货率 (%)</label>
                <div className="currency-input-container">
                  <input
                    type="number"
                    value={this.state.returnRate}
                    onChange={this.handleReturnRateChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="cost-input-field"
                    placeholder="退货率"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 运费设置部分 */}
<div className="section-card">
  <h4 className="section-title">运费设置</h4>
  <div className="cost-inputs-grid">
    <div className="cost-input">
      <label>货代费用 (CNY)</label>
      <div className="currency-input-container">
        <input
          type="number"
          value={this.state.forwardingCost}
          onChange={this.handleForwardingCostChange}
          min="0"
          step="0.01"
          className="cost-input-field"
          placeholder="货代费用"
        />
        <span className="currency-conversion">
          ≈ {(this.state.forwardingCost * this.state.exchangeRate).toFixed(2)} {region.currency}
        </span>
      </div>
    </div>

    {showRegularShipping && (
      <>
        <div className="cost-input">
          <label>头程运费 (CNY)</label>
          <div className="currency-input-container">
            <input
              type="number"
              value={this.state.shippingCost}
              onChange={this.handleShippingCostChange}
              min="0"
              step="0.01"
              className="cost-input-field"
              placeholder="头程运费"
            />
            <span className="currency-conversion">
              ≈ {(this.state.shippingCost * this.state.exchangeRate).toFixed(2)} {region.currency}
            </span>
          </div>
        </div>

        <div className="cost-input">
          <label>尾程运费 (CNY)</label>
          <div className="currency-input-container">
            <input
              type="number"
              value={this.state.tailShippingCost}
              onChange={this.handleTailShippingCostChange}
              min="0"
              step="0.01"
              className="cost-input-field"
              placeholder="尾程运费"
            />
            <span className="currency-conversion">
              ≈ {(this.state.tailShippingCost * this.state.exchangeRate).toFixed(2)} {region.currency}
            </span>
          </div>
        </div>
      </>
    )}
  </div>
  
  {/* 显示计算出的总运费 */}
<div className="total-shipping-cost">
  <span>总运费: </span>
  <span className="cost-value">
    {this.state.calculatedShippingCost.toFixed(2)} {region.currency}
  </span>
  <span className="cny-conversion">
    / {(this.state.calculatedShippingCost / this.state.exchangeRate).toFixed(2)} CNY
  </span>
  
  {/* 显示详细的计算公式 */}
  {this.state.shopType === 'crossBorder' && 
   this.state.packageSize === 'small' && 
   ['JP', 'UK', 'DE', 'FR', 'IT', 'ES'].includes(this.state.selectedRegion) &&
   this.state.smallPackageCost > 0 && (
    <div className="detailed-formula">
      <small>
        ({this.state.forwardingCost.toFixed(2)} CNY × {this.state.exchangeRate.toFixed(4)}) + {this.state.shippingFormula} = 
        {(this.state.forwardingCost * this.state.exchangeRate).toFixed(2)} + {this.state.smallPackageCost.toFixed(2)} = 
        {this.state.calculatedShippingCost.toFixed(2)} {region.currency}
      </small>
    </div>
  )}
</div>
</div>
          {/* 其他设置部分 */}
          <div className="section-card">
            <h4 className="section-title">其他设置</h4>
            <div className="other-settings-grid">
              <div className="setting-input">
                <label>提现费率 (%)</label>
                <input
                  type="number"
                  value={this.state.withdrawalRate}
                  onChange={this.handleWithdrawalRateChange}
                  min="0"
                  max="10"
                  step="0.1"
                  className="setting-input-field"
                />
                <small className="help-text">平台扣除各种费用后实际到账的费率</small>
              </div>

              <div className="setting-input">
                <label>利润率 (%)</label>
                <input
                  type="number"
                  value={this.state.profitMargin}
                  onChange={this.handleProfitMarginChange}
                  min="0"
                  max="1000"
                  step="0.1"
                  className="setting-input-field"
                />
              </div>
            </div>
          </div>

          {/* 计算按钮和结果部分 */}
          <div className="calculation-section">
            <button
              onClick={this.calculatePricing}
              className="calculate-btn"
            >
              计算定价
            </button>
{calculationDetails && (
  <div className="calculation-result">
    <h4>定价计算结果（考虑{this.state.returnRate}%退货率）</h4>
    <div className="result-item">
      <span className="result-label">建议售价:</span>
      <div className="result-value-group">
        <span className="primary-currency">
          {calculatedPrice.toFixed(2)} {region.currency}
        </span>
        <span className="cny-conversion">
          / {(calculatedPrice / this.state.exchangeRate).toFixed(2)} CNY
        </span>
      </div>
    </div>

    <div className="result-details">
      <div className="detail-group">
        <div className="detail-item">
          <span className="detail-label">总成本:</span>
          <span className="dual-currency">
            {calculationDetails.totalCostLocal.toFixed(2)} {region.currency}
            <span className="cny-conversion">
              / {calculationDetails.totalCostCNY.toFixed(2)} CNY
            </span>
          </span>
        </div>

        {/* 成本明细：调整为 3 列网格 */}
        <h5 className="detail-section-header">成本明细:</h5>
   <div className="detail-grid cost-grid">
  <div className="detail-item">
    <span className="detail-label">采购成本:</span>
    <span className="dual-currency">
      {(calculationDetails.procurementCostLocal || 0).toFixed(2)} {region.currency}
      <span className="cny-conversion">
        / {(calculationDetails.procurementCost || 0).toFixed(2)} CNY
      </span>
    </span>
  </div>
  <div className="detail-item">
    <span className="detail-label">包材成本:</span>
    <span className="dual-currency">
      {(calculationDetails.packagingCostLocal || 0).toFixed(2)} {region.currency}
      <span className="cny-conversion">
        / {(calculationDetails.packagingCost || 0).toFixed(2)} CNY
      </span>
    </span>
  </div>
  <div className="detail-item">
    <span className="detail-label">货代费用:</span>
    <span className="dual-currency">
      {(calculationDetails.forwardingCostLocal || 0).toFixed(2)} {region.currency}
      <span className="cny-conversion">
        / {(calculationDetails.forwardingCost || 0).toFixed(2)} CNY
      </span>
    </span>
  </div>
  
  {/* 根据运费模式显示不同的运费项目 */}
  {calculationDetails.isSpecialShipping ? (
    <div className="detail-item">
      <span className="detail-label">运费:</span>
      <span className="dual-currency">
        {calculationDetails.specialShippingCostLocal.toFixed(2)} {region.currency}
        <span className="cny-conversion">
          / {calculationDetails.specialShippingCost.toFixed(2)} CNY
        </span>
      </span>
    </div>
  ) : (
    <>
      <div className="detail-item">
        <span className="detail-label">头程运费:</span>
        <span className="dual-currency">
          {(calculationDetails.shippingCostLocal || 0).toFixed(2)} {region.currency}
          <span className="cny-conversion">
            / {(calculationDetails.shippingCost || 0).toFixed(2)} CNY
          </span>
        </span>
      </div>
      <div className="detail-item">
        <span className="detail-label">尾程运费:</span>
        <span className="dual-currency">
          {(calculationDetails.tailShippingCostLocal || 0).toFixed(2)} {region.currency}
          <span className="cny-conversion">
            / {(calculationDetails.tailShippingCost || 0).toFixed(2)} CNY
          </span>
        </span>
      </div>
    </>
  )}
</div>

        {/* 费用明细：调整为 4 列网格 */}
        <h5 className="detail-section-header">费用明细:</h5>
        <div className="detail-grid fee-grid">
          <div className="detail-item negative">
            <span className="detail-label">平台佣金 ({this.state.platformCommission}%):</span>
            <span className="dual-currency">
              -{calculationDetails.platformCommissionFee.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.platformCommissionFee / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">平台折扣 ({this.state.discountRate}%):</span>
            <span className="dual-currency">
              -{calculationDetails.discountAmount.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.discountAmount / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">达人佣金 ({this.state.influencerCommission}%):</span>
            <span className="dual-currency">
              -{calculationDetails.influencerCommissionFee.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.influencerCommissionFee / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
  <span className="detail-label">推广费 ({this.state.promotionRate}%):</span>
  <span className="dual-currency negative">
    -{calculationDetails.promotionFee.toFixed(2)} {region.currency}
    <span className="cny-conversion">
      / -{(calculationDetails.promotionFee / this.state.exchangeRate).toFixed(2)} CNY
    </span>
  </span>
</div>
          <div className="detail-item negative">
            <span className="detail-label">手续费 ({this.state.processingFee}%):</span>
            <span className="dual-currency">
              -{calculationDetails.processingFeeAmount.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.processingFeeAmount / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">SFP费用 ({this.state.sfpFee}%):</span>
            <span className="dual-currency">
              -{calculationDetails.sfpFeeAmount.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.sfpFeeAmount / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">消费税 ({this.state.taxRate}%):</span>
            <span className="dual-currency">
              -{calculationDetails.taxAmount.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.taxAmount / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">其他费用 ({this.state.otherFee}%):</span>
            <span className="dual-currency">
              -{calculationDetails.otherFeeAmount.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.otherFeeAmount / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">退货损失 ({this.state.returnRate}%):</span>
            <span className="dual-currency">
              -{calculationDetails.returnLoss.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.returnLoss / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
          <div className="detail-item negative">
            <span className="detail-label">提现费用 ({this.state.withdrawalRate}%):</span>
            <span className="dual-currency">
              -{calculationDetails.withdrawalFee.toFixed(2)} {region.currency}
              <span className="cny-conversion">
                / -{(calculationDetails.withdrawalFee / this.state.exchangeRate).toFixed(2)} CNY
              </span>
            </span>
          </div>
        </div>

        {/* 最终结果：全屏宽度 */}
<div className="final-results">
  <div className="detail-item total positive">
    <span className="detail-label">实际到账金额:</span>
    <span className="dual-currency">
      {calculationDetails.actualReceivedAmount.toFixed(2)} {region.currency}
      <span className="cny-conversion">
        / {(calculationDetails.actualReceivedAmount / this.state.exchangeRate).toFixed(2)} CNY
      </span>
    </span>
  </div>
  <div className="detail-item total">
    <span className="detail-label">净利润:</span>
    <span className={calculationDetails.netProfit >= 0 ? "profit-positive dual-currency" : "profit-negative dual-currency"}>
      {calculationDetails.netProfit >= 0 ? '+' : ''}{calculationDetails.netProfit.toFixed(2)} {region.currency}
      <span className="cny-conversion">
        / {calculationDetails.netProfit >= 0 ? '+' : ''}{(calculationDetails.netProfit / this.state.exchangeRate).toFixed(2)} CNY
      </span>
    </span>
  </div>
  {/* 新增：ROI显示项 */}
  <div className="detail-item">
    <span className="detail-label">投资回报率 (ROI):</span>
    <span className={calculationDetails.roi >= 0 ? "profit-positive" : "profit-negative"}>
      {calculationDetails.roi.toFixed(2)}%
    </span>
  </div>
  <div className="detail-item">
    <span className="detail-label">净利润率 (基于成本):</span>
    <span className={calculationDetails.netProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
      {calculationDetails.netProfitMargin.toFixed(2)}%
    </span>
  </div>
</div>
      </div>
    </div>
  </div>
)}

          </div>
        </div>
      </main>
    );
  }
}

export default InferredPricing;
