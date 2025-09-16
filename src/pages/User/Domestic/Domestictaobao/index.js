import React from 'react';
import './index.less';

class TaobaoPricing extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // 平台费用相关状态
            platformCommission: 5, // 平台佣金率（%）
            discountRate: 0, // 平台折扣率（%）
            promotionRate: 0, // 推广费率（%）
            otherFee: 0, // 其他费用（%）

            // 商品成本相关状态
            procurementCost: 0, // 采购成本（元）
            packagingCost: 0, // 包材成本（元）
            shippingCost: 0, // 快递费用（元）
            returnRate: 5, // 退货率（%）

            // 利润相关
            profitMargin: 20, // 利润率（%）

            // 计算结果
            calculatedPrice: 0, // 计算出的定价（元）
            calculationDetails: null // 计算详情
        };
    }

    // 组件挂载时加载数据
    componentDidMount() {
        this.loadData();
    }

    // 加载数据（从localStorage获取）
    loadData = () => {
        const savedData = localStorage.getItem('taobaoPricingData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.setState({
                platformCommission: data.platformCommission || 5,
                discountRate: data.discountRate || 0,
                promotionRate: data.promotionRate || 0,
                otherFee: data.otherFee || 0,
                procurementCost: data.procurementCost || 0,
                packagingCost: data.packagingCost || 0,
                shippingCost: data.shippingCost || 0,
                returnRate: data.returnRate || 5,
                profitMargin: data.profitMargin || 20
            });
        }
    }

    // 保存数据到localStorage
    saveData = (data) => {
        const currentData = JSON.parse(localStorage.getItem('taobaoPricingData') || '{}');
        const updatedData = { ...currentData, ...data };
        localStorage.setItem('taobaoPricingData', JSON.stringify(updatedData));
    }

    // 重置所有数据
    resetAllData = () => {
        this.setState({
            platformCommission: 5,
            discountRate: 0,
            promotionRate: 0,
            otherFee: 0,
            procurementCost: 0,
            packagingCost: 0,
            shippingCost: 0,
            returnRate: 5,
            profitMargin: 20,
            calculatedPrice: 0,
            calculationDetails: null
        }, () => {
            localStorage.removeItem('taobaoPricingData');
        });
    }

    // 处理平台费用变化
    handlePlatformCommissionChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        this.setState({ platformCommission: value });
        this.saveData({ platformCommission: value });
    }

    handleDiscountRateChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        this.setState({ discountRate: value });
        this.saveData({ discountRate: value });
    }

    handlePromotionRateChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        this.setState({ promotionRate: value });
        this.saveData({ promotionRate: value });
    }

    handleOtherFeeChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        this.setState({ otherFee: value });
        this.saveData({ otherFee: value });
    }

    // 处理成本变化
    handleProcurementCostChange = (e) => {
        const cost = parseFloat(e.target.value) || 0;
        this.setState({ procurementCost: cost });
        this.saveData({ procurementCost: cost });
    }

    handlePackagingCostChange = (e) => {
        const cost = parseFloat(e.target.value) || 0;
        this.setState({ packagingCost: cost });
        this.saveData({ packagingCost: cost });
    }

    handleShippingCostChange = (e) => {
        const cost = parseFloat(e.target.value) || 0;
        this.setState({ shippingCost: cost });
        this.saveData({ shippingCost: cost });
    }

    handleReturnRateChange = (e) => {
        const rate = parseFloat(e.target.value) || 0;
        this.setState({ returnRate: rate });
        this.saveData({ returnRate: rate });
    }

    // 处理利润率变化
    handleProfitMarginChange = (e) => {
        const margin = parseFloat(e.target.value) || 0;
        this.setState({ profitMargin: margin });
        this.saveData({ profitMargin: margin });
    }

    // 计算定价函数
    // 计算定价函数
    // 计算定价函数
    calculatePricing = () => {
        // 计算总成本
        const totalCost = this.state.procurementCost + this.state.packagingCost + this.state.shippingCost;

        // 计算总费率
        const totalFeeRate = (this.state.platformCommission + this.state.discountRate +
            this.state.promotionRate + this.state.otherFee) / 100;

        // 目标利润率（基于成本）
        const targetProfitMargin = this.state.profitMargin / 100;

        // 退货率
        const returnRateValue = this.state.returnRate / 100;

        // 正确的计算公式：
        // 净利润 = 总成本 × 目标利润率
        // 同时：净利润 = 售价 × (1 - 总费率) × (1 - 退货率) - 总成本
        // 推导出：售价 × (1 - 总费率) × (1 - 退货率) = 总成本 × (1 + 目标利润率)
        // 因此：售价 = 总成本 × (1 + 目标利润率) / [(1 - 总费率) × (1 - 退货率)]

        const denominator = (1 - totalFeeRate) * (1 - returnRateValue);
        const requiredRevenue = totalCost * (1 + targetProfitMargin) / denominator;

        // 计算各项费用明细
        const platformCommissionFee = requiredRevenue * (this.state.platformCommission / 100);
        const discountAmount = requiredRevenue * (this.state.discountRate / 100);
        const promotionFee = requiredRevenue * (this.state.promotionRate / 100);
        const otherFeeAmount = requiredRevenue * (this.state.otherFee / 100);

        // 退货损失
        const returnLoss = requiredRevenue * returnRateValue;

        // 净利润（应该等于总成本 × 目标利润率）
        const netProfit = requiredRevenue * (1 - totalFeeRate) * (1 - returnRateValue) - totalCost;

        // 净利润率（基于成本）- 这里应该等于目标利润率
        const netProfitMargin = totalCost === 0 ? 0 : (netProfit / totalCost) * 100;

        // 计算ROI（投资回报率）
        const roi = totalCost === 0 ? 0 : (netProfit / totalCost) * 100;

        // 设置计算结果
        this.setState({
            calculatedPrice: requiredRevenue,
            calculationDetails: {
                totalCost,
                platformCommissionFee,
                discountAmount,
                promotionFee,
                otherFeeAmount,
                returnLoss,
                netProfit,
                requiredRevenue,
                returnRate: returnRateValue,
                targetProfitMargin: targetProfitMargin * 100,
                netProfitMargin,
                roi
            }
        });
    }

    render() {
        const { calculatedPrice, calculationDetails } = this.state;

        return (
            <main className="taobao-calculator">
                <div className="calculator-header">
                    <h3 className="titleName">淘宝定价计算器</h3>
                    <button
                        className="reset-btn"
                        onClick={this.resetAllData}
                        title="重置所有数据"
                    >
                        重置
                    </button>
                </div>

                <div className="calculator-content">
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
                                <label>采购成本 (元)</label>
                                <input
                                    type="number"
                                    value={this.state.procurementCost}
                                    onChange={this.handleProcurementCostChange}
                                    min="0"
                                    step="0.01"
                                    className="cost-input-field"
                                    placeholder="采购成本"
                                />
                            </div>

                            <div className="cost-input">
                                <label>包材成本 (元)</label>
                                <input
                                    type="number"
                                    value={this.state.packagingCost}
                                    onChange={this.handlePackagingCostChange}
                                    min="0"
                                    step="0.01"
                                    className="cost-input-field"
                                    placeholder="包材成本"
                                />
                            </div>

                            <div className="cost-input">
                                <label>快递费用 (元)</label>
                                <input
                                    type="number"
                                    value={this.state.shippingCost}
                                    onChange={this.handleShippingCostChange}
                                    min="0"
                                    step="0.01"
                                    className="cost-input-field"
                                    placeholder="快递费用"
                                />
                            </div>

                            <div className="cost-input">
                                <label>退货率 (%)</label>
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

                    {/* 利润设置部分 */}
                    <div className="section-card">
                        <h4 className="section-title">利润设置</h4>
                        <div className="profit-setting">
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
                                    <span className="primary-currency">
                                        {calculatedPrice.toFixed(2)} 元
                                    </span>
                                </div>

                                <div className="result-details">
                                    <div className="detail-group">
                                        <div className="detail-item">
                                            <span className="detail-label">总成本:</span>
                                            <span>{calculationDetails.totalCost.toFixed(2)} 元</span>
                                        </div>

                                        <h5 className="detail-section-header">费用明细:</h5>
                                        <div className="detail-grid">
                                            <div className="detail-item negative">
                                                <span className="detail-label">平台佣金 ({this.state.platformCommission}%):</span>
                                                <span>-{calculationDetails.platformCommissionFee.toFixed(2)} 元</span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">平台折扣 ({this.state.discountRate}%):</span>
                                                <span>-{calculationDetails.discountAmount.toFixed(2)} 元</span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">推广费 ({this.state.promotionRate}%):</span>
                                                <span>-{calculationDetails.promotionFee.toFixed(2)} 元</span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">其他费用 ({this.state.otherFee}%):</span>
                                                <span>-{calculationDetails.otherFeeAmount.toFixed(2)} 元</span>
                                            </div>
                                            <div className="detail-item negative">
                                                <span className="detail-label">退货损失 ({this.state.returnRate}%):</span>
                                                <span>-{calculationDetails.returnLoss.toFixed(2)} 元</span>
                                            </div>
                                        </div>
                                        <div className="final-results">
                                            <div className="detail-item total">
                                                <span className="detail-label">净利润:</span>
                                                <span className={calculationDetails.netProfit >= 0 ? "profit-positive" : "profit-negative"}>
                                                    {calculationDetails.netProfit >= 0 ? '+' : ''}{calculationDetails.netProfit.toFixed(2)} 元
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">净利润率 (基于成本):</span>
                                                <span className={calculationDetails.netProfitMargin >= 0 ? "profit-positive" : "profit-negative"}>
                                                    {calculationDetails.netProfitMargin.toFixed(2)}%
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">目标利润率:</span>
                                                <span>{calculationDetails.targetProfitMargin.toFixed(2)}%</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">投资回报率 (ROI):</span>
                                                <span className={calculationDetails.roi >= 0 ? "profit-positive" : "profit-negative"}>
                                                    {calculationDetails.roi.toFixed(2)}%
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

export default TaobaoPricing;