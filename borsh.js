const borsh = require("borsh");

/**
 * Base class for serializable objects
 */
class Assignable {
  constructor(properties = {}) {
    if (typeof properties !== 'object') {
      throw new Error('Properties must be an object');
    }
    Object.keys(properties).forEach((key) => {
      this[key] = properties[key];
    });
  }

  validate() {
    return true;
  }
}

/**
 * Represents a single status record
 */
class Record extends Assignable {
  constructor(properties) {
    super(properties);
    this.k = properties?.k || '';
    this.v = properties?.v || '';
  }

  validate() {
    if (!this.k || typeof this.k !== 'string') {
      throw new Error('Record key (k) must be a non-empty string');
    }
    if (typeof this.v !== 'string') {
      throw new Error('Record value (v) must be a string');
    }
    return true;
  }
}

/**
 * Container for status messages
 */
class StatusMessage extends Assignable {
  constructor(properties) {
    super(properties);
    this.records = properties?.records || [];
  }

  validate() {
    if (!Array.isArray(this.records)) {
      throw new Error('Records must be an array');
    }
    this.records.forEach(record => {
      if (!(record instanceof Record)) {
        throw new Error('Each record must be an instance of Record');
      }
      record.validate();
    });
    return true;
  }

  addRecord(accountId, message) {
    const record = new Record({ k: accountId, v: message });
    record.validate();
    this.records.push(record);
    return this;
  }

  getRecordByAccount(accountId) {
    return this.records.find(record => record.k === accountId);
  }

  removeRecordByAccount(accountId) {
    const index = this.records.findIndex(record => record.k === accountId);
    if (index !== -1) {
      this.records.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Borsh schema definition
const schema = new Map([
  [StatusMessage, { kind: "struct", fields: [["records", [Record]]] }],
  [Record, {
    kind: "struct",
    fields: [
      ["k", "string"],
      ["v", "string"],
    ],
  }],
]);

/**
 * Utility functions for serialization/deserialization
 */
const BorshUtils = {
  STATE_KEY: "U1RBVEU=", // Base64 encoded "STATE"

  serialize(message) {
    if (!(message instanceof StatusMessage)) {
      throw new Error('Can only serialize StatusMessage instances');
    }
    message.validate();
    return Buffer.from(borsh.serialize(schema, message)).toString("base64");
  },

  deserialize(base64String) {
    try {
      const buffer = Buffer.from(base64String, "base64");
      const message = borsh.deserialize(schema, StatusMessage, buffer);
      message.validate();
      return message;
    } catch (error) {
      throw new Error(`Failed to deserialize message: ${error.message}`);
    }
  },

  decodeStateKey() {
    return Buffer.from(this.STATE_KEY, "base64").toString();
  }
};

// Export everything needed by other modules
module.exports = {
  StatusMessage,
  Record,
  schema,
  BorshUtils
};
