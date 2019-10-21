import { mount } from "enzyme";
import wait from "waait";
import toJSON from "enzyme-to-json";
import Nprogress from "nprogress";
import Router from "next/router";
import { MockedProvider } from "react-apollo/test-utils";
import { ApolloConsumer } from "react-apollo";
import TakeMyMoney, { CREAT_ORDER_MUTATION } from "../components/TakeMyMoney";
import { CURRENT_USER_QUERY } from "../components/User";
import { fakeUser, fakeCartItem } from "../lib/testUtils";

Router.router = { push() {} };
const mocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: {
        me: {
          ...fakeUser(),
          cart: [fakeCartItem()]
        }
      }
    }
  }
];

describe("<TakeMyMoney />", () => {
  it("should render and match snapshot", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney id="abc123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const checkoutBtn = wrapper.find("ReactStripeCheckout");
    expect(toJSON(checkoutBtn)).toMatchSnapshot();
  });
  it("should create an order ontoken", () => {
    const createOrderMock = jest.fn().mockResolvedValue({
      data: {
        createOrder: { id: "xyz789" }
      }
    });
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney id="abc123" />
      </MockedProvider>
    );
    const component = wrapper.find("TakeMyMoney").instance();
    // manually call ontoken method
    component.onToken({ id: "abc123" }, createOrderMock);
    expect(createOrderMock).toHaveBeenCalled();
    expect(createOrderMock).toHaveBeenCalledWith({
      variables: { token: "abc123" }
    });
  });
  it("should turn the progress bar on", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney id="abc123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    Nprogress.start = jest.fn();
    const createOrderMock = jest.fn().mockResolvedValue({
      data: {
        createOrder: { id: "xyz789" }
      }
    });
    const component = wrapper.find("TakeMyMoney").instance();
    // manually call ontoken method
    component.onToken({ id: "abc123" }, createOrderMock);
    expect(Nprogress.start).toHaveBeenCalled();
  });

  it("should route to the order page when completed", async () => {
    const wrapper = mount(
      <MockedProvider mocks={mocks}>
        <TakeMyMoney id="abc123" />
      </MockedProvider>
    );
    await wait();
    wrapper.update();
    const createOrderMock = jest.fn().mockResolvedValue({
      data: {
        createOrder: { id: "xyz789" }
      }
    });
    const component = wrapper.find("TakeMyMoney").instance();
    Router.router.push = jest.fn();
    // manually call ontoken method
    component.onToken({ id: "abc123" }, createOrderMock);
    await wait();
    expect(Router.router.push).toHaveBeenCalled();
    expect(Router.router.push).toHaveBeenCalledWith({
      pathname: "/order",
      query: { id: "xyz789" }
    });
  });
});
