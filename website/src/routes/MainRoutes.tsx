import RollupListPage from '@/pages/rollup';
import {RouteObject} from 'react-router';
import HomePageLayout from "@core/layouts/HomePageLayout";
import HomeContent from "@/pages/homepage";
import Page404 from "@/pages/404"
import {Outlet} from "react-router-dom";
import RollupLayout from '@/layouts/RollupLayout';

// export const MainRoutes: RouteObject = {
//   path: '/',
//   element: (
//     <GuestGuard redirectAfterLoggedin={'/'}>
//       <HomePageLayout/>
//     </GuestGuard>
//   ),
//   children: [
//     {
//       errorElement: <Page404/>,
//       children: [
//         {index: true, element: <HomeContent/>},
//         // { path: 'counter', element: <Counter /> },
//       ],
//     },
//   ],
// };

export const RollupRoute: RouteObject = {
  path: '/',
  element: (
      <RollupLayout>
        <Outlet/>
      </RollupLayout>
  ),
  children: [
    {
      errorElement: <Page404/>,
      children: [
        {path: 'rollup', element: <RollupListPage/>},
      ],
    },
  ],
};
