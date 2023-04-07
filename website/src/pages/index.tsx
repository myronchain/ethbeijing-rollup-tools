import {ReactNode} from "react";
import HomePageLayout from "@core/layouts/HomePageLayout";
import HomeContent from "./homepage";

const HomePage = () => {
  return (
    <HomeContent/>
  )
}

HomePage.getLayout = (page: ReactNode) =>
  <HomePageLayout>{page}</HomePageLayout>

export default HomePage
