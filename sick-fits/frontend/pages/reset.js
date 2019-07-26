import ResetPage from "../components/Reset";

const Sell = props => (
  <div>
    <p>reset your password {props.query.resetToken}</p>
    <ResetPage resetToken={props.query.resetToken} />
  </div>
);

export default Sell;
