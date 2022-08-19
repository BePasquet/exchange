export type Reducer<TState, TValue> = (state: TState, value: TValue) => TState;

export type ActionCreator<T = unknown> = ReturnType<typeof createAction<T>>;

export type Action<T = unknown> = ReturnType<ActionCreator<T>>;

/**
 * Creates an action creator (factory function to create events based on a type)
 * @param type action identifier
 */
export function createAction<T = unknown>(type: string) {
  const actionCreator = (payload: T) => ({
    type,
    payload,
  });

  // add type to function to be able to read type from action creator
  actionCreator.type = type;

  return actionCreator;
}

interface ReducerCase<TState, T = any> {
  action: ActionCreator<T>;
  reducer: Reducer<TState, Action<T>>;
}

/**
 * Creates a reducer base on a set of reducer cases, when a case is match the
 * specified reducer on that case will execute
 * @param initialState the state that the reducer will be run the first time
 * @param cases a set of reducer cases to match against every time an incoming action is processed
 */
export function createReducer<
  TState = unknown,
  TAction extends Action = Action
>(initialState: TState, ...cases: ReducerCase<TState>[]) {
  const eventReducer = cases.reduce(
    (state, { action, reducer }) => ({ ...state, [action.type]: reducer }),
    {} as Record<string, ReducerCase<TState>['reducer']>
  );

  return (state: TState = initialState, action: TAction) => {
    const reducer = eventReducer[action.type];
    return reducer ? reducer(state, action) : state;
  };
}
