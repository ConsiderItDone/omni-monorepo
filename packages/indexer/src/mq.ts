import amqp = require("amqplib"); // eslint-disable-line
const { AMQPPubSub } = require("graphql-amqp-subscriptions"); // eslint-disable-line
import env from "./env";

export default class MQ {
  private static mq: MQ;

  private pubsub: any;

  private constructor() {
    amqp.connect(env.RABBIT_MQ_URL).then((connection) => {
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

  public on(eventName: string): any {
    return MQ.getMQ()?.pubsub?.asyncIterator(eventName);
  }

  public emit(eventName: string, payload: any) {
    MQ.getMQ()?.pubsub?.publish(eventName, payload);
  }
}
