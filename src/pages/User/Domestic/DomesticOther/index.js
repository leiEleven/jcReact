import React from 'react';
import './index.less';
import ExchangeRateConverter from '../../../ExchangeRate';

// 导入产品分类数据
import productCategories from './product.json';

class OzonPricing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 汇率状态
      exchangeRate: 12.5,
      isLoading: false,
      lastUpdated: '',
      showExchangeModal: false,
      
      // 商品信息
      productPrice: 0,
      
      // 商品类目相关状态
      primaryCategory: '',
      secondaryCategory: '',
      secondaryOptions: [],
      commissionInfo: null,
      currentFeeTier: null,

      // 商品成本
      procurementCost: 0, // 采购成本（人民币）
      shippingCost: 0, // 头程运费（人民币）
      forwardingCost: 2, // 货代费用（人民币）
      tailShippingCost: 0, // 尾程运费（人民币）
      packagingCost: 0, // 包材成本（人民币）
      
      // 其他费用
      returnRate: 5, // 退货率（百分比）
      discountRate: 0, // 折扣率（百分比）
      withdrawalRate: 1.5, // 提现费率（百分比）
      
      // 利润计算方式
      profitMethod: 'cost', // 'cost': 总成本利润率, 'price': 售价利润率, 'fixed': 固定利润
      profitValue: 20, // 利润率或固定利润金额

      // 计算结果
      calculatedPrice: 0,
      calculationDetails: null
    };
  }

  // 组件挂载时加载数据
  componentDidMount() {
    this.loadData();
  }

  // 加载数据
  loadData = () => {
    const savedData = localStorage.getItem('ozonPricingData');
    if (savedData) {
      const data = JSON.parse(savedData);
      
      this.setState({
        exchangeRate: data.exchangeRate || 12.5,
        lastUpdated: data.lastUpdated || '',
        productPrice: data.productPrice || 0,
        primaryCategory: data.primaryCategory || '',
        secondaryCategory: data.secondaryCategory || '',
        procurementCost: data.procurementCost || 0,
        shippingCost: data.shippingCost || 0,
        forwardingCost: data.forwardingCost || 2,
        tailShippingCost: data.tailShippingCost || 0,
        packagingCost: data.packagingCost || 0,
        returnRate: data.returnRate || 5,
        discountRate: data.discountRate || 0,
        withdrawalRate: data.withdrawalRate || 1.2,
        profitMethod: data.profitMethod || 'cost',
        profitValue: data.profitValue || 20
      }, () => {
        // 如果有主类目，加载二级选项
        if (this.state.primaryCategory) {
          this.loadSecondaryOptions(this.state.primaryCategory);
        }
        
        // 如果有二级类目，加载佣金信息
        if (this.state.secondaryCategory && this.state.secondaryOptions.length > 0) {
          this.loadCommissionInfo(this.state.secondaryCategory);
        }
        
        // 如果没有汇率数据，获取汇率
        if (!data.exchangeRate) {
          this.fetchExchangeRate();
        }
      });
    } else {
      this.fetchExchangeRate();
    }
  }

  // 保存数据
  saveData = (data) => {
    const currentData = JSON.parse(localStorage.getItem('ozonPricingData') || '{}');
    const updatedData = { ...currentData, ...data };
    localStorage.setItem('ozonPricingData', JSON.stringify(updatedData));
  }

  // 获取实时汇率
  fetchExchangeRate = async () => {
    this.setState({ isLoading: true });
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/CNY`);
      
      if (!response.ok) throw new Error('汇率查询失败');

      const data = await response.json();
      const rubRate = data.rates.RUB;

      this.setState({
        exchangeRate: rubRate,
        lastUpdated: new Date().toLocaleString()
      });

      this.saveData({
        exchangeRate: rubRate,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取汇率失败:', error);
      // 使用默认汇率
      this.setState({
        exchangeRate: 12.5,
        lastUpdated: '本地缓存 ' + new Date().toLocaleString()
      });
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // 手动更新汇率
  refreshRate = () => {
    this.fetchExchangeRate();
  }

  // 打开汇率换算弹窗
  openExchangeModal = () => {
    this.setState({ showExchangeModal: true });
  }

  // 关闭汇率换算弹窗
  closeExchangeModal = () => {
    this.setState({ showExchangeModal: false });
  }

  // 加载二级类目选项
  loadSecondaryOptions = (primaryCategoryId) => {
    const primaryCat = productCategories.find(cat => cat.id === primaryCategoryId);
    if (primaryCat && primaryCat.children) {
      this.setState({ secondaryOptions: primaryCat.children });
    } else {
      this.setState({ secondaryOptions: [] });
    }
  }

  // 加载佣金信息
  loadCommissionInfo = (secondaryCategoryId) => {
    const secondaryCat = this.state.secondaryOptions.find(cat => cat.id === secondaryCategoryId);
    if (secondaryCat && secondaryCat.fee) {
      try {
        const feeData = JSON.parse(secondaryCat.fee);
        this.setState({
          commissionInfo: {
            feeData,
            deliveredPercent: secondaryCat.deliveredPercent,
            numberInPosting: secondaryCat.numberInPosting
          }
        }, () => {
          this.updateFeeTier(this.state.productPrice);
        });
      } catch (error) {
        console.error('解析佣金信息失败:', error);
        this.setState({
          commissionInfo: null,
          currentFeeTier: null
        });
      }
    } else {
      this.setState({
        commissionInfo: null,
        currentFeeTier: null
      });
    }
  }

  // 根据售价确定适用的费率区间
  getCurrentFeeTier = (feeData, price) => {
    if (!feeData || !Array.isArray(feeData)) return null;

    const applicableTier = feeData.find(tier => {
      const meetsMin = tier.min === null || price >= tier.min;
      const meetsMax = tier.max === null || price <= tier.max;
      return meetsMin && meetsMax;
    });

    return applicableTier || feeData[0];
  };

  // 更新费率区间
  updateFeeTier = (price) => {
    const { commissionInfo } = this.state;
    if (commissionInfo && commissionInfo.feeData) {
      const tier = this.getCurrentFeeTier(commissionInfo.feeData, price);
      this.setState({ currentFeeTier: tier });
    }
  }

  // ===== 事件处理函数 =====
  
  // 商品售价变化
  handlePriceChange = (e) => {
    const price = parseFloat(e.target.value) || 0;
    this.setState({ productPrice: price }, () => {
      this.saveData({ productPrice: price });
      this.updateFeeTier(price);
    });
  }

  // 一级类目变化
  handlePrimaryCategoryChange = (e) => {
    const selectedPrimary = e.target.value;
    this.setState({ 
      primaryCategory: selectedPrimary,
      secondaryCategory: '',
      commissionInfo: null,
      currentFeeTier: null
    }, () => {
      this.saveData({ 
        primaryCategory: selectedPrimary,
        secondaryCategory: ''
      });
      this.loadSecondaryOptions(selectedPrimary);
    });
  }

  // 二级类目变化
  handleSecondaryCategoryChange = (e) => {
    const selectedSecondary = e.target.value;
    this.setState({ secondaryCategory: selectedSecondary }, () => {
      this.saveData({ secondaryCategory: selectedSecondary });
      this.loadCommissionInfo(selectedSecondary);
    });
  }

  // 利润计算方式变化
  handleProfitMethodChange = (e) => {
    const profitMethod = e.target.value;
    this.setState({ profitMethod }, () => {
      this.saveData({ profitMethod });
    });
  }

  // 利润值变化
  handleProfitValueChange = (e) => {
    const profitValue = parseFloat(e.target.value) || 0;
    this.setState({ profitValue }, () => {
      this.saveData({ profitValue });
    });
  }

  // 成本变化处理
  handleProcurementCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ procurementCost: cost }, () => {
      this.saveData({ procurementCost: cost });
    });
  }

  handleShippingCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ shippingCost: cost }, () => {
      this.saveData({ shippingCost: cost });
    });
  }

  handleForwardingCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ forwardingCost: cost }, () => {
      this.saveData({ forwardingCost: cost });
    });
  }

  handleTailShippingCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ tailShippingCost: cost }, () => {
      this.saveData({ tailShippingCost: cost });
    });
  }

  handlePackagingCostChange = (e) => {
    const cost = parseFloat(e.target.value) || 0;
    this.setState({ packagingCost: cost }, () => {
      this.saveData({ packagingCost: cost });
    });
  }

  // 费率变化处理
  handleReturnRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    this.setState({ returnRate: rate }, () => {
      this.saveData({ returnRate: rate });
    });
  }

  handleDiscountRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    this.setState({ discountRate: rate }, () => {
      this.saveData({ discountRate: rate });
    });
  }

  handleWithdrawalRateChange = (e) => {
    const rate = parseFloat(e.target.value) || 0;
    this.setState({ withdrawalRate: rate }, () => {
      this.saveData({ withdrawalRate: rate });
    });
  }

  // ===== 计算函数 =====

  // 定价模式计算
  calculatePricing = () => {
    if (!this.state.commissionInfo || !this.state.currentFeeTier) {
      alert('请先选择商品类目');
      return;
    }

    const {
      procurementCost,
      packagingCost,
      forwardingCost,
      shippingCost,
      tailShippingCost,
      profitMethod,
      profitValue,
      returnRate,
      discountRate,
      withdrawalRate,
      exchangeRate
    } = this.state;

    const rfbsCommissionRate = this.state.currentFeeTier.fbs_fee;

    // 计算总成本（人民币）
    const totalCostCNY = procurementCost + packagingCost + forwardingCost + shippingCost + tailShippingCost;
    const totalCostRUB = totalCostCNY * exchangeRate;

    // 费率转换
    const returnRateValue = returnRate / 100;
    const discountRateValue = discountRate / 100;
    const withdrawalRateValue = withdrawalRate / 100;

    // 平台收入比例（扣除佣金后）
    const platformRevenueRate = 1 - rfbsCommissionRate;

    let requiredRevenue = 0;
    let calculationMethod = '';

    // 根据利润计算方法确定售价
    if (profitMethod === 'price') {
      // 售价利润率法
      const profitMargin = profitValue / 100;
      // 公式：售价×(1-折扣率)×(1-利润率-手续费率-退货率-提现费率) = 成本
      requiredRevenue = totalCostRUB / 
        ((1 - discountRateValue) * (1 - profitMargin - rfbsCommissionRate - returnRateValue - withdrawalRateValue));
      calculationMethod = `售价 = 总成本 / [(1 - ${discountRate}%折扣率) × (1 - ${profitValue}%利润率 - ${(rfbsCommissionRate * 100).toFixed(2)}%佣金率 - ${returnRate}%退货率 - ${withdrawalRate}%提现费率)]`;
    }
    else if (profitMethod === 'cost') {
      // 总成本利润率法
      const profitMargin = profitValue / 100;
      // 公式：售价×(1-折扣率)×(1-手续费率-退货率-提现费率) = 成本×(1+利润率)
      requiredRevenue = (totalCostRUB * (1 + profitMargin)) / 
        ((1 - discountRateValue) * (1 - rfbsCommissionRate - returnRateValue - withdrawalRateValue));
      calculationMethod = `售价 = [总成本 × (1 + ${profitValue}%利润率)] / [(1 - ${discountRate}%折扣率) × (1 - ${(rfbsCommissionRate * 100).toFixed(2)}%佣金率 - ${returnRate}%退货率 - ${withdrawalRate}%提现费率)]`;
    }
    else if (profitMethod === 'fixed') {
      // 固定利润法
      const fixedProfit = profitValue * exchangeRate; // 转换为卢布
      // 公式：售价×(1-折扣率)×(1-手续费率-退货率-提现费率) = 成本 + 固定利润
      requiredRevenue = (totalCostRUB + fixedProfit) / 
        ((1 - discountRateValue) * (1 - rfbsCommissionRate - returnRateValue - withdrawalRateValue));
      calculationMethod = `售价 = (总成本 + ${profitValue} CNY固定利润) / [(1 - ${discountRate}%折扣率) × (1 - ${(rfbsCommissionRate * 100).toFixed(2)}%佣金率 - ${returnRate}%退货率 - ${withdrawalRate}%提现费率)]`;
    }

    // 计算各项费用
    const discountAmount = requiredRevenue * discountRateValue;
    const revenueAfterDiscount = requiredRevenue - discountAmount;
    
    const rfbsCommission = revenueAfterDiscount * rfbsCommissionRate;
    const platformRevenue = revenueAfterDiscount - rfbsCommission;
    
    const returnLoss = revenueAfterDiscount * returnRateValue;
    const revenueAfterReturn = platformRevenue * (1 - returnRateValue);
    
    const withdrawalFee = revenueAfterReturn * withdrawalRateValue;
    const finalActualReceipt = revenueAfterReturn - withdrawalFee;

    // 计算实际利润
    const actualProfit = finalActualReceipt - totalCostRUB;
    const actualProfitMargin = (actualProfit / totalCostRUB) * 100;
    const sellingProfitMargin = (actualProfit / requiredRevenue) * 100;

    // 设置结果
    this.setState({
      calculatedPrice: requiredRevenue,
      calculationDetails: {
        totalCostCNY,
        totalCostRUB,
        requiredRevenue,
        discountAmount,
        revenueAfterDiscount,
        rfbsCommission,
        platformRevenue,
        returnLoss,
        revenueAfterReturn,
        withdrawalFee,
        finalActualReceipt,
        expectedProfit: actualProfit,
        returnRate: returnRateValue,
        discountRate: discountRateValue,
        withdrawalRate: withdrawalRateValue,
        actualProfitMargin,
        sellingProfitMargin,
        calculationMethod
      }
    });
  }

  // 重置数据
  resetAllData = () => {
    this.setState({
      exchangeRate: 12.5,
      productPrice: 0,
      primaryCategory: '',
      secondaryCategory: '',
      secondaryOptions: [],
      commissionInfo: null,
      currentFeeTier: null,
      procurementCost: 0,
      shippingCost: 0,
      forwardingCost: 2,
      tailShippingCost: 0,
      packagingCost: 0,
      returnRate: 5,
      discountRate: 0,
      withdrawalRate: 1.2,
      profitMethod: 'cost',
      profitValue: 20,
      calculatedPrice: 0,
      calculationDetails: null
    }, () => {
      localStorage.removeItem('ozonPricingData');
      this.fetchExchangeRate();
    });
  }

  render() {
    const { 
      isLoading, 
      lastUpdated, 
      calculatedPrice, 
      calculationDetails,
      productPrice,
      primaryCategory,
      secondaryCategory,
      secondaryOptions,
      commissionInfo,
      currentFeeTier,
      exchangeRate,
      profitMethod,
      profitValue
    } = this.state;

    return (
      <main className="ozon-calculator">
        <div className="calculator-header">
          <h3 className="titleName">Ozon跨境定价计算器</h3>
          <button className="reset-btn" onClick={this.resetAllData} title="重置所有数据">
            重置
          </button>
        </div>

        <div className="calculator-content">
          {/* 汇率部分 */}
          <div className="section-card">
            <h4 className="section-title">汇率信息</h4>
            <div className="rate-display">
              <label>人民币兑换卢布的汇率</label>
              <div className="rate-input-container">
                <input
                  type="number"
                  value={exchangeRate.toFixed(4)}
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
                <button
                  onClick={this.openExchangeModal}
                  className="exchange-converter-btn"
                  title="汇率换算"
                >
                  💱
                </button>
              </div>
              {lastUpdated && (
                <div className="rate-info">
                  <small>更新时间: {lastUpdated}</small>
                  <br />
                  <small>1 CNY = {exchangeRate.toFixed(4)} RUB</small>
                </div>
              )}
            </div>
          </div>

          {/* 商品信息部分 */}
          <div className="section-card">
            <h4 className="section-title">商品信息</h4>
            
            {/* 商品售价输入 */}
            <div className="product-price-section">
              <label>商品售价 (RUB)</label>
              <input
                type="number"
                value={productPrice}
                onChange={this.handlePriceChange}
                min="0"
                step="0.01"
                className="price-input"
                placeholder="请输入商品售价"
              />
            </div>

            {/* 商品类目选择部分 */}
            <div className="product-category-section">
              <label>商品类目（销售佣金取决于类别）</label>

              <div className="category-selectors">
                <div className="category-selector">
                  <select
                    value={primaryCategory}
                    onChange={this.handlePrimaryCategoryChange}
                    className="category-dropdown"
                  >
                    <option value="">选择一级类目</option>
                    {productCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.cnName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="category-selector">
                  <select
                    value={secondaryCategory}
                    onChange={this.handleSecondaryCategoryChange}
                    disabled={!primaryCategory}
                    className="category-dropdown"
                  >
                    <option value="">选择二级类目</option>
                    {secondaryOptions.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.cnName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 佣金信息展示 */}
              {commissionInfo && currentFeeTier && (
                <div className="commission-info">
                  <h5>佣金信息（当前售价: {productPrice} RUB）</h5>

                  {/* 当前适用的费率 */}
                  <div className="current-commission">
                    <div className="commission-tier">
                      <span className="tier-range">
                        价格区间: {currentFeeTier.min || 0} - {currentFeeTier.max || '∞'} RUB
                      </span>
                    </div>

                    <div className="commission-details">
                      <div className="commission-item">
                        <span className="commission-label">rFBS佣金:</span>
                        <span className="commission-value">{(currentFeeTier.fbs_fee * 100).toFixed(2)}%</span>
                      </div>
                      <div className="commission-item">
                        <span className="commission-label">FBP佣金:</span>
                        <span className="commission-value">{(currentFeeTier.fbp_fee * 100).toFixed(2)}%</span>
                      </div>
                      <div className="commission-item">
                        <span className="commission-label">FBO佣金:</span>
                        <span className="commission-value">{(currentFeeTier.fbo_fee * 100).toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* 所有费率区间 */}
                  <div className="all-commission-tiers">
                    <h6>所有价格区间的佣金费率:</h6>
                    {commissionInfo.feeData.map((tier, index) => (
                      <div key={index} className={`tier-info ${tier === currentFeeTier ? 'current-tier' : ''}`}>
                        <div className="tier-range">
                          {tier.min || 0} - {tier.max || '∞'} RUB:
                        </div>
                        <div className="tier-rates">
                          rFBS: {(tier.fbs_fee * 100).toFixed(2)}% /
                          FBP: {(tier.fbp_fee * 100).toFixed(2)}% /
                          FBO: {(tier.fbo_fee * 100).toFixed(2)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 商品成本信息部分 */}
          <div className="section-card">
            <h4 className="section-title">成本信息</h4>

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
                    ≈ {(this.state.procurementCost * exchangeRate).toFixed(2)} RUB
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
                    ≈ {(this.state.packagingCost * exchangeRate).toFixed(2)} RUB
                  </span>
                </div>
              </div>

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
                    ≈ {(this.state.forwardingCost * exchangeRate).toFixed(2)} RUB
                  </span>
                </div>
              </div>

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
                    ≈ {(this.state.shippingCost * exchangeRate).toFixed(2)} RUB
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
                    ≈ {(this.state.tailShippingCost * exchangeRate).toFixed(2)} RUB
                  </span>
                </div>
              </div>
              
              <div className="cost-input">
                <label>提现费率 (%)</label>
                <div className="currency-input-container">
                  <input
                    type="number"
                    value={this.state.withdrawalRate}
                    onChange={this.handleWithdrawalRateChange}
                    min="0"
                    step="0.1"
                    className="cost-input-field"
                    placeholder="提现费率"
                  />
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
              
              <div className="cost-input">
                <label>折扣率 (%)</label>
                <div className="currency-input-container">
                  <input
                    type="number"
                    value={this.state.discountRate}
                    onChange={this.handleDiscountRateChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="cost-input-field"
                    placeholder="折扣率"
                  />
                </div>
              </div>
            </div>
          </div>
                    {/* 利润信息部分 */}
          <div className="section-card">
            <h4 className="section-title">利润信息</h4>
            <div className="profit-settings">
              <div className="profit-method-selector">
                <label>利润计算方式</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="cost"
                      checked={profitMethod === 'cost'}
                      onChange={this.handleProfitMethodChange}
                    />
                    总成本利润率
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="price"
                      checked={profitMethod === 'price'}
                      onChange={this.handleProfitMethodChange}
                    />
                    售价利润率
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="fixed"
                      checked={profitMethod === 'fixed'}
                      onChange={this.handleProfitMethodChange}
                    />
                    固定利润
                  </label>
                </div>
              </div>

              <div className="profit-value-input">
                <label>
                  {profitMethod === 'fixed' ? '固定利润金额' : '利润率'}
                  ({profitMethod === 'fixed' ? 'CNY' : '%'})
                </label>
                <input
                  type="number"
                  value={profitValue}
                  onChange={this.handleProfitValueChange}
                  min="0"
                  step={profitMethod === 'fixed' ? "0.01" : "0.1"}
                  className="profit-input-field"
                />
                {profitMethod === 'fixed' && (
                  <span className="currency-conversion">
                    ≈ {(profitValue * exchangeRate).toFixed(2)} RUB
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 计算按钮和结果部分 */}
          <div className="calculation-section">
            <button
              onClick={this.calculatePricing}
              className="calculate-btn"
              disabled={!commissionInfo}
            >
              计算定价
            </button>
            
            {calculationDetails && (
              <div className="calculation-result">
                <h4>
                  定价计算结果（考虑{this.state.returnRate}%退货率和{this.state.discountRate}%折扣率）
                </h4>

                {/* 计算方式说明 */}
                {calculationDetails.calculationMethod && (
                  <div className="calculation-method">
                    <small>{calculationDetails.calculationMethod}</small>
                  </div>
                )}
                
                {/* 定价结果 */}
                <div className="result-item highlighted">
                  <span>建议售价:</span>
                  <span className="result-value">
                    {calculationDetails.requiredRevenue.toFixed(2)} RUB
                    <span className="cny-conversion">
                      / {(calculationDetails.requiredRevenue / exchangeRate).toFixed(2)} CNY
                    </span>
                  </span>
                </div>

                <div className="result-details">
                  {/* 收入明细 */}
                  <h5 className="detail-section-header">收入明细</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">标价（折扣前）:</span>
                      <span className="dual-currency">
                        {calculationDetails.requiredRevenue.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {(calculationDetails.requiredRevenue / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item negative">
                      <span className="detail-label">折扣金额 ({this.state.discountRate}%):</span>
                      <span className="dual-currency">
                        -{calculationDetails.discountAmount.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / -{(calculationDetails.discountAmount / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item positive">
                      <span className="detail-label">折扣后实际收入:</span>
                      <span className="dual-currency">
                        {calculationDetails.revenueAfterDiscount.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {(calculationDetails.revenueAfterDiscount / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 平台费用明细 */}
                  <h5 className="detail-section-header">平台费用明细</h5>
                  <div className="detail-grid">
                    <div className="detail-item negative">
                      <span className="detail-label">
                        rFBS佣金 (
                        {this.state.currentFeeTier && this.state.currentFeeTier.fbs_fee 
                          ? (this.state.currentFeeTier.fbs_fee * 100).toFixed(2)
                          : '0.00'
                        }%):
                      </span>
                      <span className="dual-currency">
                        -{calculationDetails.rfbsCommission.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / -{(calculationDetails.rfbsCommission / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item positive">
                      <span className="detail-label">平台实际收入:</span>
                      <span className="dual-currency">
                        {calculationDetails.platformRevenue.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {(calculationDetails.platformRevenue / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 退货损失 */}
                  <h5 className="detail-section-header">退货损失</h5>
                  <div className="detail-grid">
                    <div className="detail-item negative">
                      <span className="detail-label">退货损失 ({this.state.returnRate}%):</span>
                      <span className="dual-currency">
                        -{calculationDetails.returnLoss.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / -{(calculationDetails.returnLoss / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item positive">
                      <span className="detail-label">退货后实际收入:</span>
                      <span className="dual-currency">
                        {calculationDetails.revenueAfterReturn.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {(calculationDetails.revenueAfterReturn / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 提现费用 */}
                  <h5 className="detail-section-header">提现费用</h5>
                  <div className="detail-grid">
                    <div className="detail-item negative">
                      <span className="detail-label">提现手续费 ({this.state.withdrawalRate}%):</span>
                      <span className="dual-currency">
                        -{calculationDetails.withdrawalFee.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / -{(calculationDetails.withdrawalFee / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item positive">
                      <span className="detail-label">最终实际到账:</span>
                      <span className="dual-currency">
                        {calculationDetails.finalActualReceipt.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {(calculationDetails.finalActualReceipt / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 成本明细 */}
                  <h5 className="detail-section-header">成本明细</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">采购成本:</span>
                      <span className="dual-currency">
                        {(this.state.procurementCost * exchangeRate).toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {this.state.procurementCost.toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">包材成本:</span>
                      <span className="dual-currency">
                        {(this.state.packagingCost * exchangeRate).toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {this.state.packagingCost.toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">货代费用:</span>
                      <span className="dual-currency">
                        {(this.state.forwardingCost * exchangeRate).toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {this.state.forwardingCost.toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">头程运费:</span>
                      <span className="dual-currency">
                        {(this.state.shippingCost * exchangeRate).toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {this.state.shippingCost.toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">尾程运费:</span>
                      <span className="dual-currency">
                        {(this.state.tailShippingCost * exchangeRate).toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {this.state.tailShippingCost.toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item total">
                      <span className="detail-label">总成本:</span>
                      <span className="dual-currency">
                        {calculationDetails.totalCostRUB.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {calculationDetails.totalCostCNY.toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 利润分析 */}
                  <h5 className="detail-section-header">利润分析</h5>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">预期利润:</span>
                      <span className="dual-currency">
                        {calculationDetails.expectedProfit.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {(calculationDetails.expectedProfit / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">
                        {this.state.profitMethod === 'price' ? '实际售价利润率' :
                         this.state.profitMethod === 'cost' ? '实际成本利润率' : '实际利润率'}:
                      </span>
                      <span className={calculationDetails.actualProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
                        {calculationDetails.actualProfitMargin.toFixed(2)}%
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">售价利润率:</span>
                      <span className={calculationDetails.sellingProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
                        {calculationDetails.sellingProfitMargin.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* 最终汇总 */}
                  <div className="final-results">
                    <div className="detail-item total final-profit">
                      <span className="detail-label">最终净利润:</span>
                      <span className={calculationDetails.expectedProfit >= 0 ? "profit-positive dual-currency" : "profit-negative dual-currency"}>
                        {calculationDetails.expectedProfit >= 0 ? '+' : ''}{calculationDetails.expectedProfit.toFixed(2)} RUB
                        <span className="cny-conversion">
                          / {calculationDetails.expectedProfit >= 0 ? '+' : ''}{(calculationDetails.expectedProfit / exchangeRate).toFixed(2)} CNY
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 利润率对比 */}
                  <div className="profit-comparison">
                    <h5 className="detail-section-header">利润率对比</h5>
                    <div className="comparison-grid">
                      <div className="comparison-item">
                        <span className="comparison-label">成本利润率:</span>
                        <span className={calculationDetails.actualProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
                          {calculationDetails.actualProfitMargin.toFixed(2)}%
                        </span>
                      </div>
                      <div className="comparison-item">
                        <span className="comparison-label">售价利润率:</span>
                        <span className={calculationDetails.sellingProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
                          {calculationDetails.sellingProfitMargin.toFixed(2)}%
                        </span>
                      </div>
                      <div className="comparison-item">
                        <span className="comparison-label">投资回报率:</span>
                        <span className={calculationDetails.actualProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
                          {((calculationDetails.expectedProfit / calculationDetails.totalCostRUB) * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 汇率换算弹窗 */}
        <ExchangeRateConverter
          isOpen={this.state.showExchangeModal}
          onClose={this.closeExchangeModal}
          initialFromCurrency="CNY"
          initialToCurrency="RUB"
        />
      </main>
    );
  }
}

export default OzonPricing;