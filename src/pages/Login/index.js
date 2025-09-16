import { Form, Icon, Input, Button, Checkbox, message } from 'antd'
import React from 'react'
import { Redirect } from 'react-router-dom'
import connect from '../../utils/connect'
import './index.less'

// 本地用户数据（模拟服务端返回）
const localUsers = {
  "admin": {
    password: "pengjin123456",
    userInfo: {
      "code": 1,
      "data": {
        "avatar": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIzOCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMyIiByPSI0IiBmaWxsPSIjNjY2Ii8+PGNpcmNsZSBjeD0iNTAiIGN5PSIzMiIgcj0iNCIgZmlsbD0iIzY2NiIvPjxwYXRoIGQ9Ik0zNSA0OCBjMyAzIDUgMyAxMCAwIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yNiAzNiBsLTQgLTQiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTU0IDM2IGw0IC00IiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==",
        "name": "admin",
        "roles": [
          "admin"
        ],
        "data": [
          "inferred-pricing",
          "index",
          "tiktok",


        ]
      }
    }
  },
  "user": {
    password: "123456",
    userInfo: {
      "code": 1,
      "data": {
        "avatar": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iI2U2ZTZlNiIvPjxwYXRoIGQ9Ik00MCA0MGMxMS4wNSAwIDIwLTguOTUgMjAtMjBTNTEuMDUgMCA0MCAwIDIwIDguOTUgMjAgMjBzOC45NSAyMCAyMCAyMHptMCAzMGMtMTYuNTQgMC0zMCA2LjcxLTMwIDE1djVjMCAyLjc2IDYuNzEgNSA1IDVoNTBjMi43NiAwIDUtMi4yNCA1LTV2LTVjMC04LjI5LTEzLjQ2LTE1LTMwLTE1eiIgZmlsbD0iIzk5OSIvPjwvc3ZnPg==",
        "name": "user",
        "roles": [
          "user"
        ],
        "data": [
          "index",
          "order-list",
          "product-list",
          "goods-list"
        ]
      }
    }
  }
};

@connect
class NormalLoginForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rememberMe: false
    };
  }

  componentDidMount() {
    // 检查是否有记住的密码
    const savedUsername = localStorage.getItem('savedUsername');
    const savedPassword = localStorage.getItem('savedPassword');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (rememberMe && savedUsername && savedPassword) {
      this.props.form.setFieldsValue({
        username: savedUsername,
        password: savedPassword
      });
      
      this.setState({
        rememberMe: true
      });
    }
  }

  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.localAuthCheck(values)
      }
    })
  }

  handleRememberChange = (e) => {
    this.setState({
      rememberMe: e.target.checked
    });
  }

  localAuthCheck = (values) => {
    const { username, password } = values;
    const user = localUsers[username];
    
    // 本地验证逻辑
    if (user && user.password === password) {
      // 登录成功
      const { dispatch, authChangeAction } = this.props;
      
      // 处理记住密码功能
      if (this.state.rememberMe) {
        localStorage.setItem('savedUsername', username);
        localStorage.setItem('savedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('savedUsername');
        localStorage.removeItem('savedPassword');
        localStorage.setItem('rememberMe', 'false');
      }
      
      // 保存认证状态和用户信息到localStorage
      localStorage.setItem('authed', 'true');
      localStorage.setItem('userInfo', JSON.stringify(user.userInfo));
      localStorage.setItem('username', username);
      
      // 更新Redux状态（如果项目使用Redux）
      if (dispatch && authChangeAction) {
        const action = authChangeAction(user.userInfo);
        dispatch(action);
      }
      
      message.success('登录成功！');
    } else {
      // 登录失败
      message.error('用户名或密码错误！');
    }
  }

  render() {
    // 检查是否已认证（包括localStorage中的状态）
    const isAuthed = this.props.state.authed || localStorage.getItem('authed') === 'true';
    
    if (isAuthed) {
      return <Redirect to="/user" />;
    }
    
    const { getFieldDecorator } = this.props.form;
    const { rememberMe } = this.state;
    
    return (
      <div className="flex_center wrapper_login">
        <Form onSubmit={this.handleSubmit} className="login-form login-form-login">
          <div className="login-title">后台管理系统</div>
          
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIzOCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjZDBkMGQwIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMyIiByPSI0IiBmaWxsPSIjNjY2Ii8+PGNpcmNsZSBjeD0iNTAiIGN5PSIzMiIgcj0iNCIgZmlsbD0iIzY2NiIvPjxwYXRoIGQ9Ik0zNSA0OCBjMyAzIDUgMyAxMCAwIiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0yNiAzNiBsLTQgLTQiIHN0cm9rZT0iIzY2NiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTU0IDM2IGw0IC00IiBzdHJva2U9IiM2NjYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==" alt="精致头像" />
          </div>
          
          <Form.Item>
            {getFieldDecorator('username', {
              rules: [{ required: true, message: '请输入用户名!' }],
            })(
              <Input
                prefix={<Icon type="user" />}
                placeholder="用户名"
              />,
            )}
          </Form.Item>
          
          <Form.Item>
            {getFieldDecorator('password', {
              rules: [{ required: true, message: '请输入密码!' }],
            })(
              <Input
                prefix={<Icon type="lock" />}
                type="password"
                placeholder="密码"
              />,
            )}
          </Form.Item>
          
          <Form.Item>
            <Checkbox 
              checked={rememberMe}
              onChange={this.handleRememberChange}
            >
              记住密码
            </Checkbox>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button">
              登录
            </Button>
          </Form.Item>
          

        </Form>
      </div>
    );
  }
}

const WrappedNormalLoginForm = Form.create({ name: 'normal_login' })(NormalLoginForm)
export default WrappedNormalLoginForm