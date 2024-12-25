import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * https://dev.to/advename/comment/24a9e
 */
const keyLength = 32;

/**
 * Has a password or a secret with a password hashing algorithm (scrypt)
 * @param {string} password
 * @returns {string} The salt+hash
 */
export const hash = async (password)=> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex');

    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      resolve(`${salt}.${derivedKey.toString('hex')}`);
    });
  });
};

/**
 * Compare a plain text password with a salt+hash password
 * @param {string} password The plain text password
 * @param {string} hash The hash+salt to check against
 * @returns {boolean}
 */
export const compare = async (password, hash)=> {
  return new Promise((resolve, reject) => {
    const [salt, hashKey] = hash.split('.');
    // we need to pass buffer values to timingSafeEqual
    const hashKeyBuff = Buffer.from(hashKey, 'hex');
    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      resolve(timingSafeEqual(hashKeyBuff, derivedKey));
    });
  });
};