import { shallow, mount } from "enzyme";
import toJSON from "enzyme-to-json";
import CartCount from "../components/CartCount";

describe("<cartCount />", () => {
  it("should render correctly", () => {
    shallow(<CartCount count={10} />);
  });

  it("should match the snapshot", () => {
    const cartCount = shallow(<CartCount count={10} />);
    expect(toJSON(cartCount)).toMatchSnapshot();
  });

  it("should ", () => {
    const cartCount = shallow(<CartCount count={50} />);
    expect(toJSON(cartCount)).toMatchSnapshot();
    cartCount.setProps({ count: 10 });
    expect(toJSON(cartCount)).toMatchSnapshot();
  });
});
