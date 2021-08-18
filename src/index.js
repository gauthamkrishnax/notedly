const express = require('express');
const { ApolloServer } = require('apollo-server-express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');

//LOCAL MODULE IMPORTS
const models = require('./models/index');
const resolvers = require('./resolvers');
const typeDefs = require('./schema');
const db = require('./db');

// RUN THE SERVER ON PORT FROM ENV OR 4000
const port = process.env.PORT || 4000;

//DATABASE HOST VALUE
const DB_HOST = process.env.DB_HOST;

const app = express();
app.use(helmet());
app.use(cors());

db.connect(DB_HOST);

const getUser = token => {
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      throw new Error('Session Invalid');
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: ({ req }) => {
    const token = req.headers.authorization;
    const user = getUser(token);
    console.log(user);
    return { models, user };
  }
});

server.applyMiddleware({ app, path: '/api' });

app.listen({ port }, () =>
  console.log(`Graphql Server is running at : 
🌍 : http://localhost:${port}${server.graphqlPath}`)
);
