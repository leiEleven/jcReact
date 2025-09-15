// import Home from './pages/Home'
// import Login from './pages/Login'
// import User from './pages/User'
    // import Index from './pages/User/Home'
        import GoodsList from './pages/User/Goods/GoodsList'
        import GoodsClassify from './pages/User/Goods/GoodsClassify'
        import InferredPricing from './pages/User/OrderManage/InferredPricing'
        import InferredCost from './pages/User/OrderManage/InferredCost'
// import NotFound from './pages/NotFound'

// import SecondLevelComponent from './common/SecondLevelComponent'
// import ThirdLevelComponent from './common/ThirdLevelComponent'

import AsyncComponent from './utils/asyncComponent'
const Home = AsyncComponent(()=>import('./pages/Home'))
const Login = AsyncComponent(()=>import('./pages/Login'))
const User = AsyncComponent(()=>import('./pages/User'))
const NotFound = AsyncComponent(()=>import('./pages/NotFound'))

const SecondLevelComponent = AsyncComponent(()=>import('./common/SecondLevelComponent'))
// const ThirdLevelComponent = AsyncComponent(()=>import('./common/ThirdLevelComponent'))

const routes = [
    { path: '/',
        exact: true,
        component: Home,
        requiresAuth: false
    },
    {
        path: '/login',
        component: Login,
        requiresAuth: false,

    },
    {
        path: '/user',
        component: User,
        requiresAuth: true, //需要登陆后才能跳转的页面

        children:[
            // {
            //     path: '/user/index',
            //     pathName:'index',
            //     component:Index,
            //     name: '首页',
            //     icon:'pie-chart'
            // },
            {
                path: '/user/tiktok',
                component: SecondLevelComponent,
                pathName: 'order-manage',
                name: 'Tiktok管理',
                icon: 'eye',
                children: [
                    {
                        path: '/user/tiktok/pricing',
                        pathName: 'inferred-pricing',
                        component: InferredPricing,
                        name: '定价推算',
                        icon: 'table'
                    },
                    {
                        path: '/user/tiktok/cost',
                        pathName: 'inferred-cost',
                        component: InferredCost,
                        name: '采购价推算',
                        icon: 'eye'
                    }
                ]
            },
            {
                path: '/user/goods',
                component: SecondLevelComponent,
                pathName: 'goods',
                name: '产品管理',
                icon: 'user',
                children: [
                    {
                        path: '/user/goods/list',
                        pathName: 'goods-list',
                        component: GoodsList,
                        name: '产品列表',
                        icon: 'table'
                    },
                    {
                        path: '/user/goods/classify',
                        pathName: 'goods-classify',
                        component: GoodsClassify,
                        name: '产品分类',
                        icon: 'eye'
                    }
                ]
            },
        ]

    },
    {
        path: '*',
        component: NotFound,
        requiresAuth: false,
    }
]

export default routes