import amqp = require("amqplib"); // eslint-disable-line
import { AMQPPubSub } from "graphql-amqp-subscriptions";

export default class MQ {
  private static mq: MQ;

  private pubsub: AMQPPubSub;

  private constructor() {
    amqp.connect(process.env.RABBIT_MQ_URL).then((connection) => {
      this.pubsub = new AMQPPubSub({
        connection,
      });
    });
  }

  public static getMQ(): MQ {
    if (!MQ.mq) {
      MQ.mq = new MQ();
    }

    return MQ.mq;
  }

  public on(eventName: string): AsyncIterator<undefined> {
    return MQ.getMQ().pubsub.asyncIterator(eventName);
  }

  public emit<T>(eventName: string, payload: T): Promise<void> {
    return MQ.getMQ().pubsub.publish(eventName, payload);
  }
}