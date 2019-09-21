import OrderListItem from "../components/OrderListItem";
import PleaseSignIn from "../components/PleaseSignin";

const OrdersPage = props => (
  <div>
    <PleaseSignIn>
      <OrderListItem />
    </PleaseSignIn>
  </div>
);

export default OrdersPage;
