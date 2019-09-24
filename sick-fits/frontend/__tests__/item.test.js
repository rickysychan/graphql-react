import ItemComponent from "../components/item";
import { shallow } from "enzyme";
import toJSON from "enzyme-to-json";

const fakeItem = {
  id: "ABC123",
  title: "A Cool Item",
  price: 4000,
  description: "this item is cool",
  image: "dog.jpg",
  lageImage: "largeDog.jpg"
};

describe("<Item />", () => {
  // const wrapper = shallow(<ItemComponent item={fakeItem} />);
  // it("should render the images correctly", () => {
  //   const image = wrapper.find("img");
  //   expect(image.props().src).toBe(fakeItem.image);
  //   expect(image.props().alt).toBe(fakeItem.title);
  // });
  // it("should render and display properly", () => {
  //   const PriceTag = wrapper.find("PriceTag");
  //   const Link = wrapper.find("Title a");

  //   expect(PriceTag.dive().text()).toEqual("$50");
  //   expect(Link.text()).toBe(fakeItem.title);
  // });

  // it("should render the buttons properly", () => {
  //   console.log(wrapper.debug());
  //   const buttonList = wrapper.find(".buttonList");
  //   expect(buttonList.children()).toHaveLength(3);
  //   expect(buttonList.find("Link").exists()).toBe(true);
  //   expect(buttonList.find("DeleteItem").exists()).toBe(true);
  // });

  it("renders and matches the snapshot", () => {
    const wrapper = shallow(<ItemComponent item={fakeItem} />);

    expect(toJSON(wrapper)).toMatchSnapshot();
  });
});
