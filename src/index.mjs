
import jwt from "jsonwebtoken";

import PrismaBinding from "prisma-binding";

import chalk from "chalk";

const {
  Prisma,
} = PrismaBinding;

class Context {

  constructor(params = {}) {

    // console.log("Context params", params);

    let {
      APP_SECRET,
      db,
      getCurrentUser,
      ...other
    } = params;


    if (db === undefined) {

      db = new Prisma({
        typeDefs: 'src/schema/generated/prisma.graphql',
        ...other,
      });

    }

    if (!getCurrentUser) {

      getCurrentUser = async (ctx) => {

        let currentUser;

        const {
          request,
          connection,
        } = ctx;

        const {
          context,
        } = connection || {};

        let {
          Authorization,
        } = context || {};


        // console.log(chalk.green("getCurrentUser connection"), connection);

        Authorization = Authorization || (request && request.get('Authorization'));


        if (Authorization) {
          try {
            const token = Authorization.replace('Bearer ', '')
            const { userId } = jwt.verify(token, APP_SECRET)

            if (userId) {
              currentUser = await db.query.user({
                where: {
                  id: userId,
                },
              })
            }

          }
          catch (error) {
            // console.error(chalk.red("prisma-context getCurrentUser error"), error);
          }
        }


        return currentUser;

      };

    }



    const context = async options => {


      let context = {
        ...options,
        db,
        ...params,
      };

      let currentUser = getCurrentUser ? await getCurrentUser(context) : null;

      context.currentUser = currentUser;

      return context;

    };

    return context;

  }

}

export default Context;