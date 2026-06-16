const { createHandler } = require('@app-core/server');
const createCreatorCard = require('@app/services/creator-cards/create');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  middlewares: [],
  async handler(rc, helpers) {
    const card = await createCreatorCard(rc.body);
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATED,
      data: card,
    };
  },
});
