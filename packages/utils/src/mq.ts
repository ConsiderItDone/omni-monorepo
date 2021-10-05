import amqp, { Channel, Connection } from "amqplib";
import { AMQPPubSub } from "graphql-amqp-subscriptions";
import { ConsumeMessage } from "amqplib/properties";

export default class MQ {
  private static mq: MQ;

  private pubsub: AMQPPubSub;
  private connection: Connection;

  private constructor(mqUrl: string) {
    amqp
      .connect(mqUrl)
      .then((connection: Connection) => {
        this.connection = connection;
        this.pubsub = new AMQPPubSub({
          connection,
        });
      })
      .catch(() => {
        console.error("Could not connect to RabbitMQ");
        process.exit(1);
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
    return this.pubsub.asyncIterator(eventName);
  }

  public emit<T>(eventName: string, payload: T): Promise<void> {
    return this.pubsub.publish(eventName, payload);
  }

  public publish(queue: string, msg: Buffer) {
    this.connection.createChannel().then(async (channel: Channel) => {
      channel
        .assertQueue(queue, {
          durable: true,
          autoDelete: false,
        })
        .then(() => {
          channel.sendToQueue(queue, msg);
        });
    });
  }

  public consume(queue: string, onMessage: (msg: ConsumeMessage, channel: Channel) => void) {
    this.connection.createChannel().then(async (channel: Channel) => {
      await channel.prefetch(1);
      channel
        .assertQueue(queue, {
          durable: true,
          autoDelete: false,
        })
        .then(() => {
          channel.consume(
            queue,
            (msg: ConsumeMessage) => {
              onMessage(msg, channel);
            },
            { noAck: false }
          );
        });
    });
  }
}
