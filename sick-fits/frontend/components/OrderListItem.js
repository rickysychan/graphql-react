import gql from "graphql-tag";
import { formatDistance } from "date-fns";
import { Query } from "react-apollo";
import styled from "styled-components";
import formatMoney from "../lib/formatMoney";
import OrderItemStyles from "./styles/OrderItemStyles";
import Error from "./ErrorMessage";
import Link from "next/link";

const USER_ORDERS_QUERY = gql`
  query USER_ORDERS_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      total
      createdAt
      items {
        id
        title
        price
        description
        quantity
        image
      }
    }
  }
`;

const OrderUl = styled.ul`
  display: grid;
  grid-gap: 4rem;
  grid-template-rows: repeat(auto-fit, minmax(40%, 1fr));
`;

const OrderListItem = () => (
  <Query query={USER_ORDERS_QUERY}>
    {({ data: { orders }, error, loading }) => {
      if (loading) return <p> ...loading </p>;
      if (error) return <Error error={error} />;
      return (
        <div>
          <h2>You have {orders.length} orders</h2>
          <OrderUl>
            {orders.map(order => (
              <OrderItemStyles key={order.id}>
                <Link href={{ pathname: "/order", query: { id: order.id } }}>
                  <OrderItemStyles>
                    <a>
                      <div className="order-meta">
                        <p>
                          {order.items.reduce(
                            (tally, item) => tally + item.quantity,
                            0
                          )}{" "}
                          items
                        </p>
                        <p>{order.items.length} products</p>
                        <p>{formatDistance(order.createdAt, new Date())}</p>
                        <p>{formatMoney(order.total)}</p>
                      </div>
                      <div className="images">
                        {order.items.map(item => (
                          <img src={item.image} alt={item.title} />
                        ))}
                      </div>
                    </a>
                  </OrderItemStyles>
                </Link>
              </OrderItemStyles>
            ))}
          </OrderUl>
        </div>
      );
    }}
  </Query>
);

export default OrderListItem;
