import { mount } from "enzyme";
import toJSON from "enzyme-to-json";
import wait from "waait";
import SingleItem, { SINGLE_ITEM_QUERY } from "../components/singleItem";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeItem } from "../lib/testUtils";

describe("<SingleItem />", () => {
  it("should render properly", async () => {
    const mocks = [
      {
        //when someone makes a request with this query and variable combo
        request: { query: SINGLE_ITEM_QUERY, variables: { id: "123" } },
        // than return this fake data
        result: {
          data: { item: fakeItem() }
        }
      }
    ];
    const singleItem = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    );
    expect(singleItem.text()).toContain("Loading");
    await wait();
    singleItem.update();
    expect(toJSON(singleItem.find("h2"))).toMatchSnapshot();
    expect(toJSON(singleItem.find("img"))).toMatchSnapshot();
    expect(toJSON(singleItem.find("p"))).toMatchSnapshot();
  });

  it("Errors with a not found Item", async () => {
    const mocks = [
      {
        request: { query: SINGLE_ITEM_QUERY, variables: { id: "123" } },
        result: {
          errors: [{ message: "items not found" }]
        }
      }
    ];
    const singleItem = mount(
      <MockedProvider mocks={mocks}>
        <SingleItem id="123" />
      </MockedProvider>
    );
    await wait();
    singleItem.update();
    const item = singleItem.find('[data-test="graphql-error"]');
    expect(item.text()).toContain("items not found");
    expect(toJSON(item)).toMatchSnapshot();
  });
});
