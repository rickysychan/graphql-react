const { forwardTo } = require("prisma-binding");
const { hasPermission } = require("../utils");

const Query = {
  items: forwardTo("db"),
  item: forwardTo("db"),
  itemsConnection: forwardTo("db"),
  me(parent, args, ctx, info) {
    // check if there is a current user id
    if (!ctx.request.userId) {
      return null;
    }
    return ctx.db.query.user(
      {
        where: { id: ctx.request.userId }
      },
      info
    );
  },
  async users(parent, args, ctx, info) {
    // 1. check if they are logged in
    if (!ctx.request.userId) {
      throw new Error("you must be logged in");
    }
    // 2. first check if user has the permission to query all the users
    hasPermission(ctx.request.user, ["ADMIN", "PERMISSIONUPDATE"]);
    const users = await ctx.db.query.users({}, info);
    // 3. if they do, query all the users
    return users;
  },
  async order(parent, args, ctx, info) {
    // 1 make sure they are logged in
    if (!ctx.request.userId) {
      throw new Error("You are not logged in");
    }
    // 2 query the current order
    const order = await ctx.db.query.order({ where: { id: args.id } }, info);
    // 3 check permissions to see if they can see this order
    const ownsOrder = order.user.id === ctx.request.userId;
    const hasPermissionToSeeOrder = ctx.request.user.permissions.includes(
      "USER"
    );
    if (!ownsOrder || !hasPermissionToSeeOrder) {
      throw new Error("You cant see this budd");
    }
    // 4 return order
    return order;
  },
  async orders(parent, args, ctx, info) {
    const { userId } = ctx.request;
    // 1 make sure they are logged in
    if (!userId) {
      throw new Error("You are not logged in");
    }
    return ctx.db.query.orders(
      {
        where: { user: { id: userId } }
      },
      info
    );
  }
};

module.exports = Query;
