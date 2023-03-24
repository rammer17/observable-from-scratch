class Subscriber<T> implements Observer<T> {
  active = true;

  constructor(private destination: Observer<T>) {}

  next(value: T) {
    if(this.active) {
      this.destination.next(value);
    }
  }

  error(error: any) {
    if(this.active) {
      this.active = false;
      this.destination.error(error);
    }
  }

  complete() {
    if(this.active) {
      this.active = false;
      this.destination.complete();
    }
  }
}

class Subscription {
  private teardowns: Teardown[] = [];

  add(teardown: Teardown) {
    this.teardowns.push(teardown);
  }

  unsubscribe() {
    for(let teardown of this.teardowns) {
      teardown();
    }
    this.teardowns = [];
  }
}

class Observable<T> {
  constructor(private init: (observer: Observer<T>) => Teardown) {}

  subscribe(observer: Observer<T>): Subscription {
    const subscriber = new Subscriber(observer);
    const subscription = new Subscription;
    subscription.add(this.init(subscriber));
    return subscription;
  }

  pipe<R>(...fns: Array<(source: Observable<any>) => Observable<any>>): Observable<R> {
    return pipe(...fns)(this);
  }
}

interface Observer<T> {
  next: (value: T) => void;
  error: (error: any) => void;
  complete: () => void;
}

type Teardown = () => void;

function pipe(...fns: Array<(source: Observable<any>) => Observable<any>>) {
  return (source: Observable<any>) => 
    fns.reduce((previousValue, fn) => fn(previousValue), source);
};

const map = <T, R>(fn: (value: T) => R) => 
(source: Observable<T>) => {
  return new Observable<R>(subscriber => {
    const subs = source.subscribe({
      next(value: T) {
        subscriber.next(fn(value));
      },
      error(error: any) {
        subscriber.error(error);
      },
      complete() {
        subscriber.complete();
      }
    })
    return () => {
      subs.unsubscribe();
    }
  })
}

const my$ = new Observable((observer: Observer<number>) => {
  let i = 0;
  const interval = setInterval(() => {
    observer.next(i++);
    if(i > 4) {
      observer.complete();
    }
  }, 1000)
  
  return () => {
    observer.complete();
    clearInterval(interval);
  }
});

const subscription = my$.pipe(map(x => x * 3), map(x => x + 100)).subscribe({
  next(value: number) {console.log(value)},
  error(err: any) {console.log(err)},
  complete() {console.log("Completed")} 
});




