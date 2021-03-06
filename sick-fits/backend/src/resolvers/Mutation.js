const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes } = require("crypto");
const { promisify } = require("util");
const { transport, makeANiceEmail } = require("../mail");
const { hasPermission } = require("../utils");
const stripe = require("../stripe");

const Mutations = {
  async createItem(parent, args, ctx, info) {
    //TODO: check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("you must be logged in to do that");
    }
    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            // this is how we create a relation ship between the item and the user
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        }
      },
      info
    );
    return item;
  },

  updateItem(parent, args, ctx, info) {
    //first take a copy of the updates

    const updates = { ...args };
    //remove the id from the updates
    delete updates.id;
    //run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },

  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };

    //1. find the item

    const item = await ctx.db.query.item({ where }, `{id title user {id}}`);
    //2. check if they own that item, or have the permissions
    const ownsItem = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ["ADMIN", "ITEMDELETE"].includes(permission)
    );

    if (!ownsItem && !hasPermissions) {
      throw new Error("You Do not have Permission");
    }
    //3. Delete it
    return ctx.db.mutation.deleteItem({ where }, info);
  },

  async signUp(parent, args, ctx, info) {
    args.email.toLowerCase();
    // hash their password
    const password = await bcrypt.hash(args.password, 10);
    //create the user in the datahbase
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] }
        }
      },
      info
    );
    //create the JWT token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //we set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 //one year
    });
    // finally, we return the user to the browser
    return user;
  },

  async signIn(parent, { email, password }, ctx, info) {
    //1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email: email } });
    if (!user) {
      throw new Error(`no such user found for email ${email}`);
    }
    //2. check if the password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("invalid password");
    }
    //3. gener{ate token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //4. set cookie with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 //one year
    });
    //5. return user
    return user;
  },

  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "goodbye!" };
  },

  async requestReset(parent, args, ctx, info) {
    // 1. check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
      throw new Error(`no such user found for email ${email}`);
    }
    // 2. set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
    const res = await ctx.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry }
    });
    // 3. email them that  reset token
    const mailRes = await transport.sendMail({
      from: "ricky@spentlyhq.com",
      to: user.email,
      subject: "Your Password Reset",
      html: makeANiceEmail(
        `Your Password reset token is here! 
        \n\n 
        <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to reset</a>`
      )
    });

    //4. return the message
    return { message: "thanks!" };
  },

  async resetPassword(parent, args, ctx, info) {
    // 1. check if password match
    if (args.password !== args.confirmPassword) {
      throw new Error("Password does not match confirmed password");
    }
    // 2. check if it is a legit reset token
    // 3. check if its expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken: args.resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });

    if (!user) {
      throw new Error("reset token provided is not valid");
    }

    // 4. hash their new password
    const password = await bcrypt.hash(args.password, 10);

    // 5. save the new password to user and remove old reset token fields
    const updatedUser = await ctx.db.mutation.updateUser({
      data: { password, resetToken: null, resetTokenExpiry: null },
      where: { email: user.email }
    });

    // 6. generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);

    // 7. set the JWT in the cookie
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 //one year
    });

    // 8. return new user
    return updatedUser;
  },

  async updatePermissions(parent, args, ctx, info) {
    // 1. check to see if user is logged in
    if (!ctx.request.userId) {
      throw new Error("You must be logged in");
    }

    // 2. query the current user
    const currentUser = await ctx.db.query.user({
      where: {
        id: ctx.request.userId
      },
      info
    });
    currentUser.permissions = ctx.request.user.permissions;
    // 3. check to see if user has permission
    hasPermission(currentUser, ["ADMIN", "PERMISSIONUPDATE"]);

    // 4. update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    // 1. make sure they are signed in
    const { userId } = ctx.request;
    if (!userId) throw new Error("You are not signed in");
    // 2. query the user's current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    // 3. make sure the item is not already in their cart and increment by one if it is
    if (existingCartItem) {
      console.log("this item is already in their cart");
      console.log(existingCartItem);
      return ctx.db.mutation.updateCartItem(
        {
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 }
        },
        info
      );
    }
    // 4. if it is not than create a fresh cart item
    return ctx.db.mutation.createCartItem(
      {
        data: {
          user: {
            connect: { id: userId }
          },
          item: {
            connect: { id: args.id }
          }
        }
      },
      info
    );
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. find the cart item
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id
        }
      },
      `{id, user { id }}`
    );
    // 1.5 make sure we found this item

    if (!cartItem) throw new Error("no cart item found");
    // 2. make sure they own the cart item
    if (cartItem.user.id !== ctx.request.userId) {
      throw new Error("you do not own this cart item");
    }
    // 3. delete cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId)
      throw new Error("You must be signed in to complete this order.");
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item { title price id description image largeImage }
      }}`
    );
    // 2. recalculate the total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    console.log(`Going to charge for a total of ${amount}`);
    // 3. Create the stripe charge (turn token into $$$)
    const charge = await stripe.charges.create({
      amount,
      currency: "USD",
      source: args.token
    });
    // 4. Convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } }
      };
      delete orderItem.id;
      return orderItem;
    });

    // 5. create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } }
      }
    });
    // 6. Clean up - clear the users cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds
      }
    });
    // 7. Return the Order to the client
    return order;
  }
};

module.exports = Mutations;
