import { mount } from "enzyme";
import wait from "waait";
import PleaseSignIn from "../components/PleaseSignin";
import { CURRENT_USER_QUERY } from "../components/User";
import { MockedProvider } from "react-apollo/test-utils";
import { fakeUser } from "../lib/testUtils";

const notSignedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: { me: null }
    }
  }
];

const signedInMocks = [
  {
    request: { query: CURRENT_USER_QUERY },
    result: {
      data: { me: fakeUser() }
    }
  }
];

describe("<PleaseSignIn />", () => {
  it("should render the sign in dialogue to logged out users", async () => {
    const pleasSignIn = mount(
      <MockedProvider mocks={notSignedInMocks}>
        <PleaseSignIn />
      </MockedProvider>
    );
    await wait();
    pleasSignIn.update();
    expect(pleasSignIn.text()).toContain("Please Sign in before continuing");
    expect(pleasSignIn.find("SignIn").exists()).toBe(true);
  });

  it("should renders the child component when the user is signed in", async () => {
    const Hey = () => <p>hey</p>;
    const pleasSignIn = mount(
      <MockedProvider mocks={signedInMocks}>
        <PleaseSignIn>
          <Hey />
        </PleaseSignIn>
      </MockedProvider>
    );
    await wait();
    pleasSignIn.update();
    expect(pleasSignIn.contains(<Hey />)).toBe(true);
  });
});
