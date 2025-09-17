import React, { useState, useEffect } from 'react';
import './index.less';

// 支持的主要货币
const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
  { code: 'IDR', name: '印尼盾', symbol: 'Rp' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'VND', name: '越南盾', symbol: '₫' },
  { code: 'PHP', name: '菲律宾比索', symbol: '₱' },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$' }
];

const ExchangeRateConverter = ({ isOpen, onClose, initialFromCurrency = 'CNY', initialToCurrency = 'USD' }) => {
  const [fromCurrency, setFromCurrency] = useState(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState(initialToCurrency);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // 获取汇率
  const fetchExchangeRate = async (from, to) => {
    if (from === to) {
      setExchangeRate(1);
      setToAmount(fromAmount);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      
      if (!response.ok) throw new Error('汇率查询失败');
      
      const data = await response.json();
      const rate = data.rates[to];
      
      setExchangeRate(rate);
      setLastUpdated(new Date().toLocaleString());
      
      // 自动计算转换金额
      if (fromAmount) {
        setToAmount((parseFloat(fromAmount) * rate).toFixed(4));
      }
    } catch (error) {
      console.error('获取汇率失败:', error);
      // 使用默认汇率（这里可以设置一些常用货币对的默认汇率）
      const defaultRates = {
        'CNY-USD': 0.14,
        'CNY-EUR': 0.13,
        'CNY-GBP': 0.11,
        'CNY-JPY': 15.5,
        'CNY-BRL': 0.75,
        'USD-CNY': 7.14,
        'EUR-CNY': 7.69,
        'GBP-CNY': 9.09,
        'JPY-CNY': 0.065,
        'BRL-CNY': 1.33
      };
      
      const rateKey = `${from}-${to}`;
      const rate = defaultRates[rateKey] || 1;
      setExchangeRate(rate);
      setLastUpdated('本地缓存 ' + new Date().toLocaleString());
      
      if (fromAmount) {
        setToAmount((parseFloat(fromAmount) * rate).toFixed(4));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 处理货币选择变化
  const handleFromCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setFromCurrency(newCurrency);
    fetchExchangeRate(newCurrency, toCurrency);
  };

  const handleToCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setToCurrency(newCurrency);
    fetchExchangeRate(fromCurrency, newCurrency);
  };

  // 处理金额输入变化
  const handleFromAmountChange = (e) => {
    const value = e.target.value;
    setFromAmount(value);
    
    if (value && !isNaN(value)) {
      setToAmount((parseFloat(value) * exchangeRate).toFixed(4));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (e) => {
    const value = e.target.value;
    setToAmount(value);
    
    if (value && !isNaN(value)) {
      setFromAmount((parseFloat(value) / exchangeRate).toFixed(4));
    } else {
      setFromAmount('');
    }
  };

  // 交换货币
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setExchangeRate(1 / exchangeRate);
  };

  // 初始化汇率
  useEffect(() => {
    if (isOpen) {
      fetchExchangeRate(initialFromCurrency, initialToCurrency);
    }
  }, [isOpen, initialFromCurrency, initialToCurrency]);

  if (!isOpen) return null;

  return (
    <div className="exchange-rate-modal-overlay" onClick={onClose}>
      <div className="exchange-rate-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>汇率换算器</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="conversion-inputs">
            <div className="input-group">
              <label>从</label>
              <select 
                value={fromCurrency} 
                onChange={handleFromCurrencyChange}
                className="currency-select"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={fromAmount}
                onChange={handleFromAmountChange}
                placeholder="输入金额"
                className="amount-input"
              />
            </div>

            <div className="swap-button-container">
              <button className="swap-btn" onClick={swapCurrencies} title="交换货币">
                ⇅
              </button>
            </div>

            <div className="input-group">
              <label>到</label>
              <select 
                value={toCurrency} 
                onChange={handleToCurrencyChange}
                className="currency-select"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={toAmount}
                onChange={handleToAmountChange}
                placeholder="结果金额"
                className="amount-input"
                readOnly
              />
            </div>
          </div>

          <div className="exchange-rate-info">
            {isLoading ? (
              <div className="loading">获取汇率中...</div>
            ) : (
              <>
                <div className="rate-display">
                  汇率: 1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                </div>
                {lastUpdated && (
                  <div className="last-updated">
                    更新时间: {lastUpdated}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="common-conversions">
            <h4>常用转换</h4>
            <div className="common-rates">
              {[
                { from: 'CNY', to: 'USD', label: '人民币 → 美元' },
                { from: 'USD', to: 'CNY', label: '美元 → 人民币' },
                { from: 'CNY', to: 'EUR', label: '人民币 → 欧元' },
                { from: 'CNY', to: 'JPY', label: '人民币 → 日元' }
              ].map((pair, index) => (
                <button
                  key={index}
                  className="common-rate-btn"
                  onClick={() => {
                    setFromCurrency(pair.from);
                    setToCurrency(pair.to);
                    fetchExchangeRate(pair.from, pair.to);
                  }}
                >
                  {pair.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExchangeRateConverter;