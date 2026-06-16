const { createHandler } = require('@app-core/server');
const deleteCreatorCard = require('@app/services/creator-cards/delete');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  middlewares: [],
  async handler(rc, helpers) {
    const card = await deleteCreatorCard({
      slug: rc.params.slug,
      body: rc.body,
    });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.DELETED,
      data: card,
    };
  },
});
