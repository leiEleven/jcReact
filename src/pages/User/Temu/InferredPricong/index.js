import React from 'react';
import './index.less';
import ExchangeRateConverter from '../../../ExchangeRate';
// Temu地区数据
const temuRegions = [
    { id: 'US', name: '美国', currency: 'USD', symbol: '$' },
    { id: 'BR', name: '巴西', currency: 'BRL', symbol: 'R$' }
];

class TemuPricing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // 基础状态
            selectedRegion: 'US',
            exchangeRate: 1,
            isLoading: false,
            lastUpdated: '',
            showExchangeModal: false, // 新增：控制汇率弹窗显示状态
            // 利润信息
            profitMethod: 'cost', // 'cost', 'price', 'fixed'
            profitValue: 20, // 百分比或固定金额

            // 成本信息
            shippingCost: 0, // 运费(CNY)
            procurementCost: 0, // 采购成本(CNY)
            otherCost: 0, // 其他成本(CNY)

            // 平台费用
            platformCommission: 5, // 平台佣金率(%)
            withdrawalFeeRate: 1, // 提现手续费率(%)
            discountRate: 0, // 折扣率(%)
            otherFee: 0, // 其他费用(CNY)

            // 计算结果
            calculatedPrice: 0,
            calculationDetails: null
        };
    }

    // 获取当前地区信息
    get currentRegion() {
        const foundRegion = temuRegions.find(region => region.id === this.state.selectedRegion);
        return foundRegion ? foundRegion : temuRegions[0];
    }

    // 组件挂载时加载数据
    componentDidMount() {
        this.loadData();
    }

    // 加载数据
    loadData = () => {
        const savedData = localStorage.getItem('temuPricingData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.setState({
                selectedRegion: data.selectedRegion || 'US',
                profitMethod: data.profitMethod || 'cost',
                profitValue: data.profitValue || 20,
                shippingCost: data.shippingCost || 0,
                procurementCost: data.procurementCost || 0,
                otherCost: data.otherCost || 0,
                platformCommission: data.platformCommission || 5,
                withdrawalFeeRate: data.withdrawalFeeRate || 1,
                discountRate: data.discountRate || 0,
                otherFee: data.otherFee || 0
            }, () => {
                this.fetchExchangeRate(this.state.selectedRegion);
            });
        } else {
            this.fetchExchangeRate('US');
        }
    }

    // 保存数据
    saveData = (data) => {
        const currentData = JSON.parse(localStorage.getItem('temuPricingData') || '{}');
        const updatedData = { ...currentData, ...data };
        localStorage.setItem('temuPricingData', JSON.stringify(updatedData));
    }

    // 获取汇率
    fetchExchangeRate = async (regionCode = 'US') => {
        this.setState({ isLoading: true });
        try {
            const baseCurrency = 'CNY';
            const region = temuRegions.find(r => r.id === regionCode);
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
                'US': 0.14,
                'BR': 0.75
            };
            this.setState({
                exchangeRate: defaultRates[regionCode] || 0.14,
                lastUpdated: '本地缓存 ' + new Date().toLocaleString()
            });
        } finally {
            this.setState({ isLoading: false });
        }
    }

    // 处理地区变化
    handleRegionChange = (e) => {
        const region = e.target.value;
        this.setState({ selectedRegion: region }, () => {
            this.saveData({ selectedRegion: region });
            this.fetchExchangeRate(region);
        });
    }

    // 处理利润方法变化
    handleProfitMethodChange = (e) => {
        const profitMethod = e.target.value;
        this.setState({ profitMethod }, () => {
            this.saveData({ profitMethod });
        });
    }

    // 处理利润值变化
    handleProfitValueChange = (e) => {
        const profitValue = parseFloat(e.target.value) || 0;
        this.setState({ profitValue }, () => {
            this.saveData({ profitValue });
        });
    }

    // 处理成本变化
    handleShippingCostChange = (e) => {
        const shippingCost = parseFloat(e.target.value) || 0;
        this.setState({ shippingCost }, () => {
            this.saveData({ shippingCost });
        });
    }

    handleProcurementCostChange = (e) => {
        const procurementCost = parseFloat(e.target.value) || 0;
        this.setState({ procurementCost }, () => {
            this.saveData({ procurementCost });
        });
    }

    handleOtherCostChange = (e) => {
        const otherCost = parseFloat(e.target.value) || 0;
        this.setState({ otherCost }, () => {
            this.saveData({ otherCost });
        });
    }

    // 处理平台费用变化
    handlePlatformCommissionChange = (e) => {
        const platformCommission = parseFloat(e.target.value) || 0;
        this.setState({ platformCommission }, () => {
            this.saveData({ platformCommission });
        });
    }

    handleWithdrawalFeeRateChange = (e) => {
        const withdrawalFeeRate = parseFloat(e.target.value) || 0;
        this.setState({ withdrawalFeeRate }, () => {
            this.saveData({ withdrawalFeeRate });
        });
    }

    handleDiscountRateChange = (e) => {
        const discountRate = parseFloat(e.target.value) || 0;
        this.setState({ discountRate }, () => {
            this.saveData({ discountRate });
        });
    }

    handleOtherFeeChange = (e) => {
        const otherFee = parseFloat(e.target.value) || 0;
        this.setState({ otherFee }, () => {
            this.saveData({ otherFee });
        });
    }

    // 打开汇率换算弹窗
    openExchangeModal = () => {
        this.setState({ showExchangeModal: true });
    }

    // 关闭汇率换算弹窗
    closeExchangeModal = () => {
        this.setState({ showExchangeModal: false });
    }

    // 计算定价
    calculatePricing = () => {
        const {
            profitMethod,
            profitValue,
            shippingCost,
            procurementCost,
            otherCost,
            platformCommission,
            withdrawalFeeRate,
            discountRate,
            otherFee,
            exchangeRate
        } = this.state;

        // 计算总成本(CNY)
        const totalCostCNY = shippingCost + procurementCost + otherCost;

        // 转换为当地货币
        const totalCostLocal = totalCostCNY * exchangeRate;
        const otherFeeLocal = otherFee * exchangeRate;

        // 计算总手续费率
        const totalFeeRate = (platformCommission + withdrawalFeeRate) / 100;
        const discountRateValue = discountRate / 100;

        let requiredRevenue = 0; // 折扣后实际售价（最终售价）
        let calculationMethod = '';
        let profitMargin = 0;

        // 根据利润计算方法确定售价（折扣后价格）
        if (profitMethod === 'price') {
            // 售价利润率法：扣除折扣后仍有设定的利润率
            profitMargin = profitValue / 100;
            // 公式：售价×(1-折扣率)×(1-利润率-手续费率) = 成本+其他费用
            requiredRevenue = (totalCostLocal + otherFeeLocal) /
                ((1 - discountRateValue) * (1 - profitMargin - totalFeeRate));
            calculationMethod = `最终售价 = (总成本 + 其他费用) / [(1 - ${discountRate}%折扣率) × (1 - ${profitValue}%利润率 - ${platformCommission + withdrawalFeeRate}%手续费率)]`;
        }
        else if (profitMethod === 'cost') {
            // 总成本利润率法：扣除折扣后仍有设定的成本利润率
            profitMargin = profitValue / 100;
            // 公式：售价×(1-折扣率)×(1-手续费率) = 成本×(1+利润率)+其他费用
            requiredRevenue = (procurementCost * exchangeRate * (1 + profitMargin) + shippingCost * exchangeRate + otherFeeLocal) /
                ((1 - discountRateValue) * (1 - totalFeeRate));
            calculationMethod = `最终售价 = [采购成本×(1+${profitValue}%) + 运费 + 其他费用] / [(1 - ${discountRate}%折扣率) × (1 - ${platformCommission + withdrawalFeeRate}%手续费率)]`;
        }
        else if (profitMethod === 'fixed') {
            // 固定利润法：扣除折扣后仍有设定的固定利润
            const fixedProfit = profitValue * exchangeRate; // 转换为当地货币
            // 公式：售价×(1-折扣率)×(1-手续费率) = 成本+固定利润+其他费用
            requiredRevenue = (totalCostLocal + fixedProfit + otherFeeLocal) /
                ((1 - discountRateValue) * (1 - totalFeeRate));
            calculationMethod = `最终售价 = (总成本 + ${profitValue} CNY固定利润 + 其他费用) / [(1 - ${discountRate}%折扣率) × (1 - ${platformCommission + withdrawalFeeRate}%手续费率)]`;

            // 计算实际利润率（基于最终售价）
            profitMargin = (requiredRevenue * (1 - discountRateValue) * (1 - totalFeeRate) - totalCostLocal - otherFeeLocal) /
                (totalCostLocal + otherFeeLocal);
        }

        // 计算折扣前价格
        const basePrice = requiredRevenue / (1 - discountRateValue);

        // 计算各项费用（基于最终售价）
        const platformCommissionFee = requiredRevenue * (platformCommission / 100);
        const withdrawalFee = requiredRevenue * (withdrawalFeeRate / 100);
        const discountAmount = basePrice * discountRateValue; // 折扣金额

        // 验证实际利润率
        const actualRevenueAfterDiscount = requiredRevenue; // 折扣后实际收入
        const actualRevenueAfterFees = actualRevenueAfterDiscount * (1 - totalFeeRate);
        const actualProfit = actualRevenueAfterFees - totalCostLocal - otherFeeLocal;

        let actualProfitMargin = 0;
        if (profitMethod === 'price') {
            actualProfitMargin = (actualProfit / actualRevenueAfterDiscount) * 100;
        } else if (profitMethod === 'cost') {
            actualProfitMargin = (actualProfit / (totalCostLocal + otherFeeLocal)) * 100;
        }

        // 计算净利润
        const netProfit = actualProfit;

        // 设置计算结果
        this.setState({
            calculatedPrice: requiredRevenue,
            calculationDetails: {
                totalCostCNY,
                totalCostLocal,
                platformCommissionFee,
                withdrawalFee,
                discountAmount,
                otherFeeLocal,
                netProfit,
                calculationMethod,
                exchangeRate,
                profitMargin: profitMethod === 'fixed' ? profitMargin * 100 : actualProfitMargin,
                totalFeeRate: totalFeeRate * 100,
                basePrice,
                discountRateValue: discountRateValue * 100,
                actualRevenueAfterDiscount,
                actualRevenueAfterFees
            }
        });
    }

    // 重置数据
    resetAllData = () => {
        this.setState({
            selectedRegion: 'US',
            profitMethod: 'cost',
            profitValue: 20,
            shippingCost: 0,
            procurementCost: 0,
            otherCost: 0,
            platformCommission: 5,
            withdrawalFeeRate: 1,
            discountRate: 0,
            otherFee: 0,
            calculatedPrice: 0,
            calculationDetails: null
        }, () => {
            localStorage.removeItem('temuPricingData');
            this.fetchExchangeRate('US');
        });
    }

    render() {
        const { isLoading, lastUpdated, calculatedPrice, calculationDetails } = this.state;
        const region = this.currentRegion;

        return (
            <main className="temu-calculator">
                <div className="calculator-header">
                    <h3 className="titleName">Temu定价计算器</h3>
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
                        <h4 className="section-title">经营站点与汇率</h4>
                        <div className="region-rate-container">
                            <div className="region-selector">
                                <label>选择经营站点</label>
                                <select
                                    value={this.state.selectedRegion}
                                    onChange={this.handleRegionChange}
                                    className="region-dropdown"
                                >
                                    {temuRegions.map(region => (
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
                                        onClick={() => this.fetchExchangeRate(this.state.selectedRegion)}
                                        disabled={isLoading}
                                        className="refresh-btn"
                                        title="更新汇率"
                                    >
                                        {isLoading ? '🔄' : '↻'}
                                    </button>
                                    {/* 新增汇率换算按钮 */}
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
                                        <small>1 CNY = {this.state.exchangeRate.toFixed(4)} {region.currency}</small>
                                    </div>
                                )}
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
                                            checked={this.state.profitMethod === 'cost'}
                                            onChange={this.handleProfitMethodChange}
                                        />
                                        总成本利润率
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="price"
                                            checked={this.state.profitMethod === 'price'}
                                            onChange={this.handleProfitMethodChange}
                                        />
                                        售价利润率
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            value="fixed"
                                            checked={this.state.profitMethod === 'fixed'}
                                            onChange={this.handleProfitMethodChange}
                                        />
                                        固定利润
                                    </label>
                                </div>
                            </div>

                            <div className="profit-value-input">
                                <label>
                                    {this.state.profitMethod === 'fixed' ? '固定利润金额' : '利润率'}
                                    ({this.state.profitMethod === 'fixed' ? 'CNY' : '%'})
                                </label>
                                <input
                                    type="number"
                                    value={this.state.profitValue}
                                    onChange={this.handleProfitValueChange}
                                    min="0"
                                    step={this.state.profitMethod === 'fixed' ? "0.01" : "0.1"}
                                    className="profit-input-field"
                                />
                                {this.state.profitMethod === 'fixed' && (
                                    <span className="currency-conversion">
                                        ≈ {(this.state.profitValue * this.state.exchangeRate).toFixed(2)} {region.currency}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 成本信息部分 */}
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
                                    />
                                    <span className="currency-conversion">
                                        ≈ {(this.state.procurementCost * this.state.exchangeRate).toFixed(2)} {region.currency}
                                    </span>
                                </div>
                            </div>

                            <div className="cost-input">
                                <label>运费 (CNY)</label>
                                <div className="currency-input-container">
                                    <input
                                        type="number"
                                        value={this.state.shippingCost}
                                        onChange={this.handleShippingCostChange}
                                        min="0"
                                        step="0.01"
                                        className="cost-input-field"
                                    />
                                    <span className="currency-conversion">
                                        ≈ {(this.state.shippingCost * this.state.exchangeRate).toFixed(2)} {region.currency}
                                    </span>
                                </div>
                            </div>

                            <div className="cost-input">
                                <label>其他成本 (CNY)</label>
                                <div className="currency-input-container">
                                    <input
                                        type="number"
                                        value={this.state.otherCost}
                                        onChange={this.handleOtherCostChange}
                                        min="0"
                                        step="0.01"
                                        className="cost-input-field"
                                    />
                                    <span className="currency-conversion">
                                        ≈ {(this.state.otherCost * this.state.exchangeRate).toFixed(2)} {region.currency}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 平台费用部分 */}
                    <div className="section-card">
                        <h4 className="section-title">平台费用</h4>
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
                                <label>提现手续费率 (%)</label>
                                <input
                                    type="number"
                                    value={this.state.withdrawalFeeRate}
                                    onChange={this.handleWithdrawalFeeRateChange}
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    className="fee-input-field"
                                />
                            </div>

                            <div className="fee-input">
                                <label>折扣率 (%)</label>
                                <input
                                    type="number"
                                    value={this.state.discountRate}
                                    onChange={this.handleDiscountRateChange}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className="fee-input-field"
                                />
                                <small className="help-text">例如: 9折输入10, 8.5折输入15</small>
                            </div>

                            <div className="fee-input">
                                <label>其他费用 (CNY)</label>
                                <div className="currency-input-container">
                                    <input
                                        type="number"
                                        value={this.state.otherFee}
                                        onChange={this.handleOtherFeeChange}
                                        min="0"
                                        step="0.01"
                                        className="fee-input-field"
                                    />
                                    <span className="currency-conversion">
                                        ≈ {(this.state.otherFee * this.state.exchangeRate).toFixed(2)} {region.currency}
                                    </span>
                                </div>
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
                                <h4>定价计算结果（扣除{this.state.discountRate}%折扣后）</h4>

                                {/* 折扣前价格 */}
                                <div className="result-item">
                                    <span className="result-label">标价（折扣前）:</span>
                                    <div className="result-value-group">
                                        <span className="primary-currency">
                                            {calculationDetails.basePrice.toFixed(2)} {region.currency}
                                        </span>
                                        <span className="cny-conversion">
                                            / {(calculationDetails.basePrice / this.state.exchangeRate).toFixed(2)} CNY
                                        </span>
                                    </div>
                                </div>

                                {/* 折扣金额 */}
                                <div className="result-item negative">
                                    <span className="result-label">折扣金额 ({this.state.discountRate}%):</span>
                                    <div className="result-value-group">
                                        <span className="primary-currency">
                                            -{calculationDetails.discountAmount.toFixed(2)} {region.currency}
                                        </span>
                                        <span className="cny-conversion">
                                            / -{(calculationDetails.discountAmount / this.state.exchangeRate).toFixed(2)} CNY
                                        </span>
                                    </div>
                                </div>

                                {/* 最终售价 */}
                                <div className="result-item highlighted">
                                    <span className="result-label">实际售价（折扣后）:</span>
                                    <div className="result-value-group">
                                        <span className="primary-currency">
                                            {calculatedPrice.toFixed(2)} {region.currency}
                                        </span>
                                        <span className="cny-conversion">
                                            / {(calculatedPrice / this.state.exchangeRate).toFixed(2)} CNY
                                        </span>
                                    </div>
                                </div>

                                {/* 验证利润率 */}
                                <div className="result-item">
                                    <span className="result-label">
                                        {this.state.profitMethod === 'price' ? '实际售价利润率' :
                                            this.state.profitMethod === 'cost' ? '实际成本利润率' : '实际利润率'}:
                                    </span>
                                    <div className="result-value-group">
                                        <span className="primary-currency">
                                            {calculationDetails.profitMargin.toFixed(2)}%
                                        </span>
                                        <span className="cny-conversion">
                                            {this.state.profitMethod === 'price' ? '（基于实际售价）' :
                                                this.state.profitMethod === 'cost' ? '（基于总成本）' : '（基于总成本）'}
                                        </span>
                                    </div>
                                </div>

                                <div className="result-details">
                                    <div className="detail-group">
                                        <div className="calculation-method">
                                            <small>{calculationDetails.calculationMethod}</small>
                                        </div>

                                        {/* 收入验证 */}
                                        <h5 className="detail-section-header">收入验证:</h5>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">折扣后实际收入:</span>
                                                <span className="dual-currency">
                                                    {calculationDetails.actualRevenueAfterDiscount.toFixed(2)} {region.currency}
                                                </span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">扣除平台费用后:</span>
                                                <span className="dual-currency">
                                                    {calculationDetails.actualRevenueAfterFees.toFixed(2)} {region.currency}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">扣除成本后净利润:</span>
                                                <span className={calculationDetails.netProfit >= 0 ? "profit-positive dual-currency" : "profit-negative dual-currency"}>
                                                    {calculationDetails.netProfit >= 0 ? '+' : ''}{calculationDetails.netProfit.toFixed(2)} {region.currency}
                                                </span>
                                            </div>
                                        </div>

                                        <h5 className="detail-section-header">成本明细:</h5>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">总成本:</span>
                                                <span className="dual-currency">
                                                    {calculationDetails.totalCostLocal.toFixed(2)} {region.currency}
                                                    <span className="cny-conversion">
                                                        / {calculationDetails.totalCostCNY.toFixed(2)} CNY
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <h5 className="detail-section-header">费用明细:</h5>
                                        <div className="detail-grid">
                                            <div className="detail-item negative">
                                                <span className="detail-label">总手续费率 ({calculationDetails.totalFeeRate.toFixed(2)}%):</span>
                                                <span className="dual-currency">
                                                    -{(calculationDetails.platformCommissionFee + calculationDetails.withdrawalFee).toFixed(2)} {region.currency}
                                                </span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">平台佣金 ({this.state.platformCommission}%):</span>
                                                <span className="dual-currency">
                                                    -{calculationDetails.platformCommissionFee.toFixed(2)} {region.currency}
                                                </span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">提现手续费 ({this.state.withdrawalFeeRate}%):</span>
                                                <span className="dual-currency">
                                                    -{calculationDetails.withdrawalFee.toFixed(2)} {region.currency}
                                                </span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">其他费用:</span>
                                                <span className="dual-currency">
                                                    -{calculationDetails.otherFeeLocal.toFixed(2)} {region.currency}
                                                    <span className="cny-conversion">
                                                        / -{this.state.otherFee.toFixed(2)} CNY
                                                    </span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="final-results">
                                            <div className="detail-item total">
                                                <span className="detail-label">最终净利润:</span>
                                                <span className={calculationDetails.netProfit >= 0 ? "profit-positive dual-currency" : "profit-negative dual-currency"}>
                                                    {calculationDetails.netProfit >= 0 ? '+' : ''}{calculationDetails.netProfit.toFixed(2)} {region.currency}
                                                    <span className="cny-conversion">
                                                        / {calculationDetails.netProfit >= 0 ? '+' : ''}{(calculationDetails.netProfit / this.state.exchangeRate).toFixed(2)} CNY
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                {/* 新增汇率换算弹窗 */}
                <ExchangeRateConverter
                    isOpen={this.state.showExchangeModal}
                    onClose={this.closeExchangeModal}
                    initialFromCurrency="CNY"
                    initialToCurrency={region.currency}
                />
            </main>
        );
    }
}

export default TemuPricing;

