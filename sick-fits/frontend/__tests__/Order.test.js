import { mount } from "enzyme";
import wait from "waait";
import toJSON from "enzyme-to-json";
import { MockedProvider } from "react-apollo/test-utils";
import Order, { SINGLE_ORDER_QUERY } from "../components/Order";
import { fakeOrder } from "../lib/testUtils";

const mocks = [
  {
    request: { query: SINGLE_ORDER_QUERY, variables: { id: "ord123" } },
    result: {
      data: {
        order: {
          ...fakeOrder()
        }
      }
    }
  }
];

describe("<Order />", () => {
  it("should render and match snapshot", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <Order id="ord123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const order = wrapper.find('div[data-test="order"]');
    // console.log(wrapper.debug());

    expect(toJSON(order)).toMatchSnapshot();
    expect(toJSON(wrapper.find(".items")).children).toHaveLength(2);
  });

  it("should should have the correct meta data", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <Order id="ord123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const order = wrapper.find('div[data-test="order"]');
    expect(order.find('span[data-test="orderID"]').text()).toBe("ord123");
    expect(order.find('span[data-test="charge"]').text()).toBe("ch_123");
    expect(order.find('span[data-test="date"]').text()).toBe(
      "March 31, 2018 8:00 PM"
    );
    expect(order.find('span[data-test="total"]').text()).toBe("$400");
    expect(order.find('span[data-test="itemCount"]').text()).toBe("2");
  });
});
