import { AUTH_CHANGE,PERMISSION_CHANGE, CURRENT_CHANGE } from './actionTypes'
import { createActions } from 'redux-actions';
import { recursionRouter } from '../utils/recursion-router'
import routes from '../router'
// import request from '../utils/request'
import { filterRoutes } from '../utils'
import { recursionRouterThree } from '../utils/recursion-router'

// export const doAuthChangeAction = (res) => {
//     return {
//         type:AUTH_CHANGE,
//         authStatus:res
//     }
// }
export const doAuthChangeAction = createActions(
    {
        [AUTH_CHANGE]:(res) => {
            return {
                authStatus:res
            }
        },
        [PERMISSION_CHANGE]:(permissionList,currentList,avatar,name) => {
            return {
                permissionList,
                currentList,
                avatar,
                name
            }
        },
        [CURRENT_CHANGE]:(list) => {
            return {
                currentList:list
            }
        }
    }
)

export const authChangeAction = (token) =>{
    return (dispatch) =>{
            const action = doAuthChangeAction.authChange(token)
            dispatch(action)
    }
}

export const permissionAction = (path) => {
    return (dispatch) => {
        // 从localStorage获取用户名
        const username = localStorage.getItem('username') || 'admin';
        
        // 本地用户信息数据
        const localUserInfo = {
            "admin": {
                "code": 1,
                "data": {
                    "avatar": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iI2U2ZTZlNiIvPjxwYXRoIGQ9Ik00MCA0MGMxMS4wNSAwIDIwLTguOTUgMjAtMjBTNTEuMDUgMCA0MCAwIDIwIDguOTUgMjAgMjBzOC45NSAyMCAyMCAyMHptMCAzMGMtMTYuNTQgMC0zMCA2LjcxLTMwIDE1djVjMCAyLjc2IDYuNzEgNSA1IDVoNTBjMi43NiAwIDUtMi4yNCA1LTV2LTVjMC04LjI5LTEzLjQ2LTE1LTMwLTE1eiIgZmlsbD0iIzk5OSIvPjwvc3ZnPg==",
                    "name": "admin",
                    "roles": ["admin"],
                    "data": [

                        "inferred-pricing",
                        "inferred-cost",

                        
                        "index", "order-manage", "product-manage", "product-list", 
                        "review-manage",  "goods", "goods-list", "goods-classify", 
                        "permission", "user-manage", "role-manage", "menu-manage"
                    ]
                }
            },
            "user": {
                "code": 1,
                "data": {
                    "avatar": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCIgdmlld0JveD0iMCAwIDgwIDgwIj48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSI0MCIgZmlsbD0iI2U2ZTZlNiIvPjxwYXRoIGQ9Ik00MCA0MGMxMS4wNSAwIDIwLTguOTUgMjAtMjBTNTEuMDUgMCA0MCAwIDIwIDguOTUgMjAgMjBzOC45NSAyMCAyMCAyMHptMCAzMGMtMTYuNTQgMC0zMCA2LjcxLTMwIDE1djVjMCAyLjc2IDYuNzEgNSA1IDVoNTBjMi43NiAwIDUtMi4yNCA1LTV2LTVjMC04LjI5LTEzLjQ2LTE1LTMwLTE1eiIgZmlsbD0iIzk5OSIvPjwvc3ZnPg==",
                    "name": "user",
                    "roles": ["user"],
                    "data": [
                        "index", "order-list", "product-list", "goods-list"
                    ]
                }
            }
        };

        // 获取相应用户的信息，如果没有找到则使用admin
        const userInfo = localUserInfo[username] || localUserInfo["admin"];
        const res = userInfo;

        // 原有的权限处理逻辑
        const allList = routes[2].children;
        res.data.data.push('index'); // 把首页丢进去
        const permissionList = recursionRouter(res.data.data, allList);
        
        const defaultOpenKeys = filterRoutes(path);
        const currentList = recursionRouterThree(defaultOpenKeys, permissionList);
        
        // 分发action
        const action = doAuthChangeAction.permissionChange(
            permissionList, 
            currentList, 
            res.data.avatar, 
            res.data.name
        );
        dispatch(action);
    };
};

export const currentAction = (list) =>{
    return (dispatch) =>{
            const action = doAuthChangeAction.currentChange(list)
            dispatch(action)
    }
}
