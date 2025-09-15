import React from 'react';
import './index.less';

// 支持的地区数据（包含东南亚、美洲等地区）
const regions = [
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

class EnhancedCostCalculator extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // 基础设置
      selectedRegion: 'US',
      exchangeRate: 0.14, // 默认1人民币=0.14美元
      isLoading: false,
      lastUpdated: '',

      // 平台费用（包含推广费率、SFP费率）
      platformCommission: 5,     // 平台佣金率（%）
      influencerCommission: 10,  // 达人佣金率（%）
      promotionRate: 8,          // 推广费率（%）
      sfpRate: 0,                // SFP费率（%）
      processingFee: 2,          // 手续费（%）
      taxRate: 0,                // 消费税率（%）
      otherFee: 0,               // 其他费用（%）

      // 成本相关
      sellingPrice: 0,           // 平台售价（当地货币）
      shippingCost: 0,           // 运费（人民币）
      packagingCost: 0,          // 包材成本（人民币）
      otherCost: 0,              // 其他成本（人民币）
      returnRate: 5,             // 退货率（%）

      // 利润目标
      profitMargin: 20,          // 目标利润率（%）
      withdrawalRate: 1.2,       // 提现费率（%）

      // 计算结果
      calculatedCost: 0,         // 反推出的采购成本（人民币）
      calculationDetails: null   // 计算详情
    };
  }

  // 获取当前地区信息
  get currentRegion() {
    const foundRegion = regions.find(region => region.id === this.state.selectedRegion);
    return foundRegion ? foundRegion : regions[0];
  }

  // 组件挂载时加载数据
  componentDidMount() {
    this.loadSavedData();
  }

  // 从本地存储加载数据
  loadSavedData = () => {
    const savedData = localStorage.getItem('enhancedCostData');
    if (savedData) {
      const data = JSON.parse(savedData);
      // 确保推广费率和SFP费率有默认值
      this.setState({
        ...data,
        promotionRate: data.promotionRate || 8,
        sfpRate: data.sfpRate || 0
      });
    }
  }

  // 保存数据到本地存储
  saveData = () => {
    localStorage.setItem('enhancedCostData', JSON.stringify(this.state));
  }

  // 重置所有数据
  resetAllData = () => {
    this.setState({
      selectedRegion: 'US',
      exchangeRate: 0.14,
      platformCommission: 5,
      influencerCommission: 10,
      promotionRate: 8,          // 推广费率默认值
      sfpRate: 0,                // SFP费率默认值
      processingFee: 2,
      taxRate: 0,
      otherFee: 0,
      sellingPrice: 0,
      shippingCost: 0,
      packagingCost: 0,
      otherCost: 0,
      returnRate: 5,
      profitMargin: 20,
      withdrawalRate: 1.2,
      calculatedCost: 0,
      calculationDetails: null
    }, () => {
      localStorage.removeItem('enhancedCostData');
    });
  }

  // 获取实时汇率
  fetchExchangeRate = async () => {
    this.setState({ isLoading: true });
    try {
      const baseCurrency = 'CNY';
      const region = this.currentRegion;

      // 使用汇率API获取实时汇率
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
      
      if (!response.ok) throw new Error('汇率获取失败');
      
      const data = await response.json();
      this.setState({
        exchangeRate: data.rates[region.currency],
        lastUpdated: new Date().toLocaleString(),
        isLoading: false
      }, this.saveData);
      
    } catch (error) {
      console.error('获取汇率失败，使用默认值:', error);
      // 使用默认汇率
      const defaultRates = {
        'US': 0.14, 'MX': 2.5, 'BR': 0.75,
        'UK': 0.11, 'DE': 0.13, 'FR': 0.13,
        'JP': 15.5, 'CN': 1,
        'TH': 4.8, 'ID': 2150, 'SG': 0.19, 
        'VN': 3400, 'PH': 8.0, 'MY': 0.65,
        'AU': 0.22
      };
      this.setState({
        exchangeRate: defaultRates[this.state.selectedRegion] || 0.14,
        lastUpdated: '使用默认汇率',
        isLoading: false
      }, this.saveData);
    }
  }

  // 处理地区变化
  handleRegionChange = (e) => {
    this.setState({ selectedRegion: e.target.value }, () => {
      this.fetchExchangeRate();
    });
  }

  // 处理输入变化
  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: parseFloat(value) || 0 }, this.saveData);
  }

  // 核心计算逻辑：包含推广费率、SFP费率的成本反推
  calculateCost = () => {
    const {
      sellingPrice, exchangeRate, profitMargin, withdrawalRate, returnRate,
      platformCommission, influencerCommission, promotionRate, sfpRate,
      processingFee, taxRate, otherFee,
      shippingCost, packagingCost, otherCost
    } = this.state;

    // 如果售价为0，不进行计算
    if (sellingPrice <= 0) {
      this.setState({ calculatedCost: 0, calculationDetails: null });
      return;
    }

    // 1. 计算总费用率，包含推广费率、SFP费率
    const totalFeeRate = (platformCommission + influencerCommission + promotionRate + sfpRate +
                         processingFee + taxRate + otherFee) / 100;

    // 2. 计算扣除所有费用后的金额
    const amountAfterFees = sellingPrice * (1 - totalFeeRate);

    // 3. 考虑退货影响
    const returnFactor = (100 - returnRate) / 100;
    const amountAfterReturns = amountAfterFees * returnFactor;

    // 4. 扣除提现费用
    const amountAfterWithdrawal = amountAfterReturns * (1 - withdrawalRate / 100);

    // 5. 将金额转换为人民币
    const amountInCNY = amountAfterWithdrawal / exchangeRate;

    // 6. 计算其他固定成本总和（人民币）
    const fixedCosts = shippingCost + packagingCost + otherCost;

    // 7. 计算目标利润所需的金额
    const requiredProfit = amountInCNY * (profitMargin / 100);

    // 8. 反推出最大可接受的采购成本
    const maxProcurementCost = amountInCNY - fixedCosts - requiredProfit;

    // 计算详细费用明细，包含推广费、SFP费
    const region = this.currentRegion;
    const details = {
      // 收入相关
      sellingPrice,
      sellingPriceCNY: sellingPrice / exchangeRate,

      // 费用明细（当地货币），包含推广费、SFP费
      platformCommission: sellingPrice * (platformCommission / 100),
      influencerCommission: sellingPrice * (influencerCommission / 100),
      promotionFee: sellingPrice * (promotionRate / 100), // 推广费计算
      sfpFee: sellingPrice * (sfpRate / 100),            // SFP费计算
      processingFee: sellingPrice * (processingFee / 100),
      tax: sellingPrice * (taxRate / 100),
      otherFee: sellingPrice * (otherFee / 100),
      withdrawalFee: amountAfterReturns * (withdrawalRate / 100),

      // 成本明细（人民币）及其当地货币等值
      shippingCost,
      shippingCostLocal: shippingCost * exchangeRate,
      packagingCost,
      packagingCostLocal: packagingCost * exchangeRate,
      otherCost,
      otherCostLocal: otherCost * exchangeRate,
      fixedCosts,
      fixedCostsLocal: fixedCosts * exchangeRate,

      // 中间计算结果（双币种）
      amountAfterFees,
      amountAfterFeesCNY: amountAfterFees / exchangeRate,
      amountAfterReturns,
      amountAfterReturnsCNY: amountAfterReturns / exchangeRate,
      amountAfterWithdrawal,
      amountAfterWithdrawalCNY: amountAfterWithdrawal / exchangeRate,
      amountInCNY,
      requiredProfit,
      requiredProfitLocal: requiredProfit * exchangeRate,

      // 最终结果（双币种）
      maxProcurementCost,
      maxProcurementCostLocal: maxProcurementCost * exchangeRate,
      totalCost: maxProcurementCost + fixedCosts,
      totalCostLocal: (maxProcurementCost + fixedCosts) * exchangeRate,
      netProfit: amountInCNY - (maxProcurementCost + fixedCosts),
      netProfitLocal: (amountInCNY - (maxProcurementCost + fixedCosts)) * exchangeRate,
      roi: ((amountInCNY - (maxProcurementCost + fixedCosts)) / (maxProcurementCost + fixedCosts) * 100) || 0
    };

    this.setState({
      calculatedCost: Math.max(0, maxProcurementCost), // 确保成本不为负数
      calculationDetails: details
    });
  }

  render() {
    const { 
      isLoading, lastUpdated, sellingPrice, calculatedCost,
      calculationDetails, promotionRate, sfpRate
    } = this.state;
    const region = this.currentRegion;
    const currencySymbol = region.symbol;
    const currencyCode = region.currency;

    return (
      <div className="basic-cost-calculator">
        <div className="calculator-header">
          <h2>采购成本反推计算器</h2>
          <button 
            className="reset-button" 
            onClick={this.resetAllData}
          >
            重置
          </button>
        </div>

        <div className="calculator-body">
          {/* 地区和汇率设置 */}
          <div className="input-section">
            <h3>地区与汇率</h3>
            <div className="input-group">
              <label>选择地区</label>
              <select
                name="selectedRegion"
                value={this.state.selectedRegion}
                onChange={this.handleRegionChange}
                disabled={isLoading}
                className="region-select"
              >
                {regions.map(reg => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name} ({reg.currency} {reg.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>
                1人民币 = {this.state.exchangeRate.toFixed(4)} {currencyCode}
              </label>
              <button
                onClick={this.fetchExchangeRate}
                disabled={isLoading}
                className="refresh-rate"
              >
                {isLoading ? '更新中...' : '更新汇率'}
              </button>
              {lastUpdated && <small>更新时间: {lastUpdated}</small>}
            </div>
          </div>

          {/* 售价与成本设置（移至平台费用设置上方） */}
          <div className="input-section">
            <h3>售价与成本设置</h3>
            <div className="input-grid">
              <div className="input-group">
                <label>平台售价 ({currencyCode})</label>
                <input
                  type="number"
                  name="sellingPrice"
                  value={sellingPrice}
                  onChange={this.handleInputChange}
                  min="0"
                  step="0.01"
                />
                <small>≈ {((sellingPrice || 0) / this.state.exchangeRate).toFixed(2)} 人民币</small>
              </div>

              <div className="input-group">
                <label>运费 (人民币)</label>
                <input
                  type="number"
                  name="shippingCost"
                  value={this.state.shippingCost}
                  onChange={this.handleInputChange}
                  min="0"
                  step="0.01"
                />
                <small>≈ {((this.state.shippingCost || 0) * this.state.exchangeRate).toFixed(2)} {currencyCode}</small>
              </div>

              <div className="input-group">
                <label>包材成本 (人民币)</label>
                <input
                  type="number"
                  name="packagingCost"
                  value={this.state.packagingCost}
                  onChange={this.handleInputChange}
                  min="0"
                  step="0.01"
                />
                <small>≈ {((this.state.packagingCost || 0) * this.state.exchangeRate).toFixed(2)} {currencyCode}</small>
              </div>

              <div className="input-group">
                <label>其他成本 (人民币)</label>
                <input
                  type="number"
                  name="otherCost"
                  value={this.state.otherCost}
                  onChange={this.handleInputChange}
                  min="0"
                  step="0.01"
                />
                <small>≈ {((this.state.otherCost || 0) * this.state.exchangeRate).toFixed(2)} {currencyCode}</small>
              </div>

              <div className="input-group">
                <label>退货率 (%)</label>
                <input
                  type="number"
                  name="returnRate"
                  value={this.state.returnRate}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="input-group">
                <label>提现费率 (%)</label>
                <input
                  type="number"
                  name="withdrawalRate"
                  value={this.state.withdrawalRate}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="input-group">
                <label>目标利润率 (%)</label>
                <input
                  type="number"
                  name="profitMargin"
                  value={this.state.profitMargin}
                  onChange={this.handleInputChange}
                  min="0"
                  max="500"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* 平台费用设置 - 包含推广费率和SFP费率 */}
          <div className="input-section">
            <h3>平台费用设置 (%)</h3>
            <div className="input-grid">
              <div className="input-group">
                <label>平台佣金率</label>
                <input
                  type="number"
                  name="platformCommission"
                  value={this.state.platformCommission}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <small>平台收取的基础佣金比例</small>
              </div>

              <div className="input-group">
                <label>达人佣金率</label>
                <input
                  type="number"
                  name="influencerCommission"
                  value={this.state.influencerCommission}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <small>支付给推广达人的佣金比例</small>
              </div>

              <div className="input-group">
                <label>推广费率</label>
                <input
                  type="number"
                  name="promotionRate"
                  value={promotionRate}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <small>包括广告投放等推广费用比例</small>
              </div>

              <div className="input-group">
                <label>SFP费率</label>
                <input
                  type="number"
                  name="sfpRate"
                  value={sfpRate}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <small>亚马逊SFP配送相关费用比例</small>
              </div>

              <div className="input-group">
                <label>手续费率</label>
                <input
                  type="number"
                  name="processingFee"
                  value={this.state.processingFee}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="input-group">
                <label>消费税率</label>
                <input
                  type="number"
                  name="taxRate"
                  value={this.state.taxRate}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div className="input-group">
                <label>其他费用率</label>
                <input
                  type="number"
                  name="otherFee"
                  value={this.state.otherFee}
                  onChange={this.handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* 计算按钮 */}
          <div className="calculate-section">
            <button
              className="calculate-button"
              onClick={this.calculateCost}
              disabled={sellingPrice <= 0}
            >
              反推最大可接受采购成本
            </button>
          </div>

          {/* 计算结果 - 双币种显示 */}
          {calculationDetails && (
            <div className="result-section">
              <h3>计算结果</h3>
              
              <div className="key-result">
                <span className="result-label">最大可接受采购成本:</span>
                <div className="result-value">
                  <div className="primary">
                    {calculatedCost.toFixed(2)} 人民币
                  </div>
                  <div className="secondary-currency">
                    {currencySymbol}{calculationDetails.maxProcurementCostLocal.toFixed(2)} {currencyCode}
                  </div>
                </div>
              </div>

              <div className="result-details">
                <h4>详细计算 (双币种显示):</h4>
                
                <div className="detail-group">
                  <h5>收入情况</h5>
                  <div className="detail-item">
                    <span>平台售价:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{currencySymbol}{calculationDetails.sellingPrice.toFixed(2)} {currencyCode}</div>
                      <div className="secondary">≈ {calculationDetails.sellingPriceCNY.toFixed(2)} 人民币</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>扣除所有费用后:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{currencySymbol}{calculationDetails.amountAfterFees.toFixed(2)} {currencyCode}</div>
                      <div className="secondary">≈ {calculationDetails.amountAfterFeesCNY.toFixed(2)} 人民币</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>考虑退货后:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{currencySymbol}{calculationDetails.amountAfterReturns.toFixed(2)} {currencyCode}</div>
                      <div className="secondary">≈ {calculationDetails.amountAfterReturnsCNY.toFixed(2)} 人民币</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>扣除提现费用后:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{currencySymbol}{calculationDetails.amountAfterWithdrawal.toFixed(2)} {currencyCode}</div>
                      <div className="secondary">≈ {calculationDetails.amountAfterWithdrawalCNY.toFixed(2)} 人民币</div>
                    </div>
                  </div>
                </div>

                <div className="detail-group">
                  <h5>费用明细 ({currencyCode})</h5>
                  <div className="detail-item negative">
                    <span>平台佣金 ({this.state.platformCommission}%):</span>
                    <span>-{currencySymbol}{calculationDetails.platformCommission.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>达人佣金 ({this.state.influencerCommission}%):</span>
                    <span>-{currencySymbol}{calculationDetails.influencerCommission.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>推广费用 ({this.state.promotionRate}%):</span>
                    <span>-{currencySymbol}{calculationDetails.promotionFee.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>SFP费用 ({this.state.sfpRate}%):</span>
                    <span>-{currencySymbol}{calculationDetails.sfpFee.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>手续费 ({this.state.processingFee}%):</span>
                    <span>-{currencySymbol}{calculationDetails.processingFee.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>消费税 ({this.state.taxRate}%):</span>
                    <span>-{currencySymbol}{calculationDetails.tax.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>其他费用 ({this.state.otherFee}%):</span>
                    <span>-{currencySymbol}{calculationDetails.otherFee.toFixed(2)}</span>
                  </div>
                  <div className="detail-item negative">
                    <span>提现费用 ({this.state.withdrawalRate}%):</span>
                    <span>-{currencySymbol}{calculationDetails.withdrawalFee.toFixed(2)}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h5>成本构成</h5>
                  <div className="detail-item">
                    <span>运费:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{calculationDetails.shippingCost.toFixed(2)} 人民币</div>
                      <div className="secondary">{currencySymbol}{calculationDetails.shippingCostLocal.toFixed(2)} {currencyCode}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>包材成本:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{calculationDetails.packagingCost.toFixed(2)} 人民币</div>
                      <div className="secondary">{currencySymbol}{calculationDetails.packagingCostLocal.toFixed(2)} {currencyCode}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>其他成本:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{calculationDetails.otherCost.toFixed(2)} 人民币</div>
                      <div className="secondary">{currencySymbol}{calculationDetails.otherCostLocal.toFixed(2)} {currencyCode}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>采购成本:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{calculationDetails.maxProcurementCost.toFixed(2)} 人民币</div>
                      <div className="secondary">{currencySymbol}{calculationDetails.maxProcurementCostLocal.toFixed(2)} {currencyCode}</div>
                    </div>
                  </div>
                  <div className="detail-item total">
                    <span>总成本合计:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{calculationDetails.totalCost.toFixed(2)} 人民币</div>
                      <div className="secondary">{currencySymbol}{calculationDetails.totalCostLocal.toFixed(2)} {currencyCode}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-group">
                  <h5>利润情况</h5>
                  <div className="detail-item">
                    <span>目标利润:</span>
                    <div className="dual-currency-display">
                      <div className="primary">{calculationDetails.requiredProfit.toFixed(2)} 人民币</div>
                      <div className="secondary">{currencySymbol}{calculationDetails.requiredProfitLocal.toFixed(2)} {currencyCode}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>实际净利润:</span>
                    <div className={`dual-currency-display ${calculationDetails.netProfit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                      <div className="primary">
                        {calculationDetails.netProfit >= 0 ? '+' : ''}{calculationDetails.netProfit.toFixed(2)} 人民币
                      </div>
                      <div className="secondary">
                        {calculationDetails.netProfit >= 0 ? '+' : ''}{currencySymbol}{calculationDetails.netProfitLocal.toFixed(2)} {currencyCode}
                      </div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span>投资回报率 (ROI):</span>
                    <span className={calculationDetails.roi >= 0 ? 'profit-positive' : 'profit-negative'}>
                      {calculationDetails.roi.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default EnhancedCostCalculator;
