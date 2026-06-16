const { createHandler } = require('@app-core/server');
const getCreatorCardBySlug = require('@app/services/creator-cards/get-by-slug');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const card = await getCreatorCardBySlug({
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    });
    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.RETRIEVED,
      data: card,
    };
  },
});
