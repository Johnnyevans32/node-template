/* eslint-disable camelcase */
const validator = require('@app-core/validator');
const { throwAppError, throwBusinessError, ERROR_CODE } = require('@app-core/errors');
const { randomBytes } = require('@app-core/randomness');
const creatorCardRepository = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;
const ACCESS_CODE_REGEX = /^[a-zA-Z0-9]{6}$/;
const URL_REGEX = /^https?:\/\//;
const MAX_SLUG_BASE_LENGTH = 43;

const createSpec = `root {
  title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<minLength:1|maxLength:100>
    url string<maxLength:200>
  }
  service_rates? {
    currency string(NGN|USD|GBP|GHS)
    rates[] {
      name string<minLength:3|maxLength:100>
      description? string<maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateSpec = validator.parse(createSpec);

function generateSlugFromTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, MAX_SLUG_BASE_LENGTH);
}

async function resolveUniqueSlug(baseSlug) {
  const existing = await creatorCardRepository.findOne({ query: { slug: baseSlug } });
  if (!existing) return baseSlug;
  return `${baseSlug}-${randomBytes(6)}`;
}

function serializeCard(card) {
  const { _id, __v, ...rest } = card;
  return { id: _id, ...rest };
}

async function createCreatorCard(data) {
  const validated = validator.validate(data, parsedCreateSpec);

  if (validated.links) {
    validated.links.forEach((link) => {
      if (!URL_REGEX.test(link.url)) {
        throwAppError('Each link url must start with http:// or https://', 'SPCL_VALIDATION', {
          details: [{ field: 'links.url', message: 'url must start with http:// or https://' }],
        });
      }
    });
  }

  if (validated.service_rates) {
    validated.service_rates.rates.forEach((rate) => {
      if (!Number.isInteger(rate.amount)) {
        throwAppError(
          'rate amount must be a positive integer with no decimals',
          'SPCL_VALIDATION',
          {
            details: [
              { field: 'service_rates.rates.amount', message: 'amount must be a positive integer' },
            ],
          }
        );
      }
    });
  }

  if (validated.slug && !SLUG_REGEX.test(validated.slug)) {
    throwAppError(
      'slug may only contain letters, numbers, hyphens and underscores',
      'SPCL_VALIDATION',
      {
        details: [
          {
            field: 'slug',
            message: 'slug may only contain letters, numbers, hyphens and underscores',
          },
        ],
      }
    );
  }

  if (validated.access_code && !ACCESS_CODE_REGEX.test(validated.access_code)) {
    throwAppError('access_code must be exactly 6 alphanumeric characters', 'SPCL_VALIDATION', {
      details: [
        { field: 'access_code', message: 'access_code must be exactly 6 alphanumeric characters' },
      ],
    });
  }

  const access_type = validated.access_type || 'public';

  if (access_type === 'private' && !validated.access_code) {
    throwBusinessError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.INVLDDATA, 'AC01');
  }

  if (access_type !== 'private' && validated.access_code) {
    throwBusinessError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.INVLDDATA, 'AC05');
  }

  let { slug } = validated;

  if (!slug) {
    const baseSlug = generateSlugFromTitle(validated.title);
    if (baseSlug.length < 5) {
      slug = (baseSlug ? `${baseSlug}-` : '') + randomBytes(6);
    } else {
      slug = await resolveUniqueSlug(baseSlug);
    }
  } else {
    const existing = await creatorCardRepository.findOne({ query: { slug } });
    if (existing) {
      throwBusinessError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.INVLDDATA, 'SL02');
    }
  }

  const cardData = {
    title: validated.title,
    description: validated.description ?? null,
    slug,
    creator_reference: validated.creator_reference,
    links: validated.links ?? [],
    service_rates: validated.service_rates ?? null,
    status: validated.status,
    access_type,
    access_code: access_type === 'private' ? validated.access_code : null,
    deleted: null,
  };

  const created = await creatorCardRepository.create(cardData);
  return serializeCard(created);
}

module.exports = createCreatorCard;
