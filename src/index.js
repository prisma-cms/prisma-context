

const jwt = require('jsonwebtoken')

const { Prisma } = require('prisma-binding')

const chalk = require("chalk");

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

      getCurrentUser = async (request) => {

        let currentUser;

        // console.log(chalk.green("getCurrentUser", request));
        // console.log(chalk.green("getCurrentUser 2", request.get('Authorization')));

        const Authorization = request && request.get('Authorization');

        // console.log(chalk.green("Authorization get", Authorization));

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
                // .catch(error => {
                //   console.error(chalk.red("prisma-context db.query.user error"), error);
                // });
            }

            // console.log(chalk.green("getCurrentUser userId", userId));
            // console.log(chalk.green("getCurrentUser userId currentUser", currentUser));

          }
          catch (error) {
            // console.error(chalk.red("prisma-context getCurrentUser error"), error);
          }
        }

        // console.log(chalk.green("getCurrentUser currentUser", currentUser));

        return currentUser;

      };

    }



    const context = async options => {

      const {
        request,
        response,
      } = options || {};

      let currentUser = getCurrentUser ? await getCurrentUser(request) : null;


      return {
        ...options,
        db,
        currentUser,
        ...params,
      };

    };

    return context;

  }

}

export default Context;