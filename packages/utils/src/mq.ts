import amqp = require("amqplib"); // eslint-disable-line
import { AMQPPubSub } from "graphql-amqp-subscriptions";

export default class MQ {
  private static mq: MQ;

  private pubsub: AMQPPubSub;

  private constructor() {
    const defaultValue = 'amqps://bxeqnybs:mWgk06St1xygCfY7tTTA9-kunar71hCX@jellyfish.rmq.cloudamqp.com/bxeqnybs';
    amqp.connect(process.env.RABBIT_MQ_URL || defaultValue).then((connection) => {
      this.pubsub = new AMQPPubSub({
        connection,
      });
    });
  }

  public static async init(mqUrl: string): Promise<MQ> {
    if (!MQ.mq) {
      MQ.mq = new MQ(mqUrl);
    }

    // wait for 2 seconds for init connection with rabbitmq
    await new Promise((resolve) => {
      setTimeout(resolve, 2000); // eslint-disable-line
    });

    return MQ.mq;
  }

  public static getMQ(): MQ {
    if (!MQ.mq) {
      throw new Error("MQ is not initialized properly");
    }

    return MQ.mq;
  }

  public on(eventName: string): AsyncIterator<undefined> {
    return MQ.getMQ()?.pubsub?.asyncIterator(eventName);
  }

  public emit<T>(eventName: string, payload: T): Promise<void> {
    return MQ.getMQ()?.pubsub?.publish(eventName, payload);
  }
}
