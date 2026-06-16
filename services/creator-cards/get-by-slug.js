/* eslint-disable camelcase */
const { throwBusinessError, ERROR_CODE } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

function serializeCard(card) {
  const { _id, __v, access_code, ...rest } = card;
  return { id: _id, ...rest };
}

async function getCreatorCardBySlug({ slug, access_code }) {
  const card = await creatorCardRepository.findOne({ query: { slug, deleted: null } });

  if (!card) {
    throwBusinessError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF01');
  }

  if (card.status === 'draft') {
    throwBusinessError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF02');
  }

  if (card.access_type === 'private') {
    if (!access_code) {
      throwBusinessError(CreatorCardMessages.CARD_IS_PRIVATE, ERROR_CODE.INVLDREQ, 'AC03');
    }
    if (access_code !== card.access_code) {
      throwBusinessError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.INVLDREQ, 'AC04');
    }
  }

  return serializeCard(card);
}

module.exports = getCreatorCardBySlug;
