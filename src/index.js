

const jwt = require('jsonwebtoken')

const { Prisma } = require('prisma-binding')

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

        const Authorization = request && request.get('Authorization');

        if (Authorization) {
          try {
            const token = Authorization.replace('Bearer ', '')
            const { userId } = jwt.verify(token, APP_SECRET)

            if (userId) {
              currentUser = await db.query.user({
                where: {
                  id: userId,
                },
              });
            }
          }
          catch (error) {
            console.error(error);
          }
        }

      };

    }



    const context = async options => {

      const {
        request,
        response,
      } = options || {};

      let currentUser = getCurrentUser ? getCurrentUser(request) : null;


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