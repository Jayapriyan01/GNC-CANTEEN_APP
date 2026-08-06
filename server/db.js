const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB || 'flasho';
const useMongo = Boolean(mongoUri);

class JsonDB {
  constructor(fileName) {
    this.filePath = path.join(__dirname, fileName);
    this.data = [];
    this.load();
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      this.data = [];
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      this.data = raw ? JSON.parse(raw) : [];
    } catch (error) {
      this.data = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error(`Error saving ${this.filePath}:`, err);
    }
  }

  insert(item) {
    this.data.push(item);
    this.save();
    return item;
  }

  find(query = {}) {
    const results = this.data.filter((item) => {
      return Object.entries(query).every(([key, value]) => item[key] === value);
    });

    const originalSort = results.sort.bind(results);
    results.sort = function (comparator) {
      if (typeof comparator === 'object' && comparator !== null) {
        const key = Object.keys(comparator)[0];
        const dir = comparator[key];
        return originalSort((a, b) => {
          const valA = a[key] ?? '';
          const valB = b[key] ?? '';
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
          return 0;
        });
      }
      return originalSort(comparator);
    };

    return results;
  }

  findOne(query = {}) {
    return this.find(query)[0] || null;
  }

  update(query = {}, update = {}) {
    const item = this.findOne(query);
    if (!item) return null;

    const changes = update.$set || update;
    Object.assign(item, changes);
    this.save();
    return item;
  }
}

class MongoDBAdapter {
  constructor(collectionName, indexes = []) {
    this.collectionName = collectionName;
    this.indexes = indexes;
    this.clientPromise = this.connect();
  }

  async connect() {
    const client = new MongoClient(mongoUri);
    await client.connect();
    this.client = client;
    this.collection = client.db(mongoDbName).collection(this.collectionName);
    if (this.indexes.length > 0) {
      await this.collection.createIndexes(this.indexes);
    }
    return this.collection;
  }

  async getCollection() {
    if (!this.collection) {
      await this.clientPromise;
    }
    return this.collection;
  }

  async insert(item) {
    const collection = await this.getCollection();
    await collection.insertOne(item);
    return item;
  }

  async find(query = {}) {
    const collection = await this.getCollection();
    return collection.find(query, { projection: { _id: 0 } }).toArray();
  }

  async findOne(query = {}) {
    const collection = await this.getCollection();
    return collection.findOne(query, { projection: { _id: 0 } });
  }

  async update(query = {}, update = {}) {
    const collection = await this.getCollection();
    const changes = update.$set || update;
    const result = await collection.findOneAndUpdate(query, { $set: changes }, { returnDocument: 'after', projection: { _id: 0 } });
    return result.value;
  }
}

const ordersDB = useMongo
  ? new MongoDBAdapter('orders', [{ key: { id: 1 }, unique: true }])
  : new JsonDB('orders.json');
const studentsDB = useMongo
  ? new MongoDBAdapter('students', [{ key: { roll: 1 }, unique: true }])
  : new JsonDB('students.json');
const staffDB = useMongo
  ? new MongoDBAdapter('staff', [{ key: { email: 1 }, unique: true }])
  : new JsonDB('staff.json');

const ready = useMongo
  ? Promise.all([ordersDB.clientPromise, studentsDB.clientPromise, staffDB.clientPromise])
  : Promise.resolve();

module.exports = {
  ordersDB,
  studentsDB,
  staffDB,
  ready
};

