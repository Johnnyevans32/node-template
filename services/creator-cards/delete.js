const validator = require('@app-core/validator');
const { throwBusinessError, ERROR_CODE } = require('@app-core/errors');
const creatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

const deleteSpec = `root {
  creator_reference string<length:20>
}`;

const parsedDeleteSpec = validator.parse(deleteSpec);

function serializeCard(card) {
  const { _id, __v, ...rest } = card;
  return { id: _id, ...rest };
}

async function deleteCreatorCard({ slug, body }) {
  validator.validate(body, parsedDeleteSpec);

  const card = await creatorCardRepository.findOne({ query: { slug, deleted: null } });

  if (!card) {
    throwBusinessError(CreatorCardMessages.NOT_FOUND, ERROR_CODE.NOTFOUND, 'NF01');
  }

  const deleted = Date.now();

  await creatorCardRepository.updateOne({
    query: { slug },
    updateValues: { deleted },
  });

  return serializeCard({ ...card, deleted, updated: deleted });
}

module.exports = deleteCreatorCard;
