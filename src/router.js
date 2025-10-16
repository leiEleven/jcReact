// import Home from './pages/Home'
// import Login from './pages/Login'
// import User from './pages/User'
    // import Index from './pages/User/Home'
        import Domestictaobao from './pages/User/Domestic/Domestictaobao'
        import DomesticOther from './pages/User/Domestic/DomesticOther'
        import InferredPricing from './pages/User/Tiktok/InferredPricing'
        import InferredCost from './pages/User/Tiktok/InferredCost'
        import TemuInferredPricing from './pages/User/Temu/InferredPricong'
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
                pathName: 'tiktok',
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
                path: '/user/domestic',
                component: SecondLevelComponent,
                pathName: 'domestic',
                name: '国内平台',
                icon: 'user',
                children: [
                    {
                        path: '/user/domestic/taobao',
                        pathName: 'domestic-taobao',
                        component: Domestictaobao,
                        name: '淘宝定价',
                        icon: 'table'
                    },
                    {
                        path: '/user/domestic/other',
                        pathName: 'domestic-other',
                        component: DomesticOther,
                        name: 'Ozon',
                        icon: 'eye'
                    }
                ]
            },
            {
                path: '/user/temu',
                component: SecondLevelComponent,
                pathName: 'temu',
                name: 'Temu管理',
                icon: 'apple',
                children: [
                    {
                        path: '/user/temu/pricing',
                        pathName: 'temu-inferred-pricing',
                        component: TemuInferredPricing,
                        name: '定价推算',
                        icon: 'table'
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