import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch, QueryConstraint, getDoc } from 'firebase/firestore'
import { db } from './firebase'

/* ────────────────────────────────
   Shared types
──────────────────────────────── */

type QueryOptions = {
  where?: QueryConstraint | QueryConstraint[]
  orderBy?: QueryConstraint
  limit?: number
}

type ReindexItem = {
  id: string
  laneId: string
}

/* ────────────────────────────────
   Query builder
──────────────────────────────── */

function buildQuery(collectionRef: string, options?: QueryOptions) {
  const constraints: QueryConstraint[] = []

  if (options?.where) {
    constraints.push(...(Array.isArray(options.where) ? options.where : [options.where]))
  }

  constraints.push(options?.orderBy ?? orderBy('order', 'asc'))

  if (options?.limit) {
    constraints.push(limit(options.limit))
  }

  return query(collection(db, collectionRef), ...constraints)
}

/* ────────────────────────────────
   INDEX (realtime — list)
──────────────────────────────── */

export function index<T>(collectionRef: string, callback: (data: T[]) => void, options?: QueryOptions) {
  const q = buildQuery(collectionRef, options)

  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((doc) => ({
        ...(doc.data() as T),
        id: doc.id,
      })) as T[]
    )
  })
}

/* ────────────────────────────────
   INDEX ONCE (non-realtime — list)
──────────────────────────────── */

export async function indexOnce<T>(collectionRef: string, options?: QueryOptions): Promise<T[]> {
  const q = buildQuery(collectionRef, options)
  const snapshot = await getDocs(q)

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as T),
    id: doc.id,
  })) as T[]
}

/* ────────────────────────────────
   SHOW (realtime — single)
──────────────────────────────── */

export function show<T>(collectionRef: string, id: string, callback: (data: T | null) => void) {
  const ref = doc(db, collectionRef, id)

  return onSnapshot(ref, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback({
      ...(snapshot.data() as T),
      id: snapshot.id,
    })
  })
}

/* ────────────────────────────────
   SHOW ONCE (non-realtime — single)
──────────────────────────────── */

export async function showOnce<T>(collectionRef: string, id: string): Promise<T | null> {
  const snapshot = await getDoc(doc(db, collectionRef, id))

  if (!snapshot.exists()) return null

  return {
    ...(snapshot.data() as T),
    id: snapshot.id,
  }
}

/* ────────────────────────────────
   STORE (auto order)
──────────────────────────────── */

export async function store<T extends Record<string, any>>(
  collectionRef: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'order'> & {
    order?: number
  },
  options?: { where?: QueryConstraint | QueryConstraint[]; step?: number }
) {
  let order = data.order
  const step = options?.step ?? 1000

  // auto-generate order if missing
  if (order == null) {
    const q = buildQuery(collectionRef, {
      where: options?.where,
      orderBy: orderBy('order', 'desc'),
      limit: 1,
    })

    const snap = await getDocs(q)
    order = snap.empty ? step : snap.docs[0].data().order + step
  }

  return addDoc(collection(db, collectionRef), {
    ...data,
    order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

/* ────────────────────────────────
   UPDATE
──────────────────────────────── */

export async function update<T extends Record<string, any>>(collectionRef: string, id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>) {
  return updateDoc(doc(db, collectionRef, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

/* ────────────────────────────────
   REMOVE
──────────────────────────────── */

export async function remove(collectionRef: string, id: string) {
  return deleteDoc(doc(db, collectionRef, id))
}

/* ────────────────────────────────
   REINDEX (writeBatch)
──────────────────────────────── */

export async function reindex<T extends { id: string }>(collectionRef: string, items: T[], step = 1000) {
  const batch = writeBatch(db)

  items.forEach((item, index) => {
    batch.update(doc(db, collectionRef, item.id), {
      order: (index + 1) * step,
      updatedAt: serverTimestamp(),
    })
  })

  await batch.commit()
}

export async function reindexItems(collectionRef: string, items: ReindexItem[], step = 1000) {
  const batch = writeBatch(db)

  const grouped = items.reduce<Record<string, ReindexItem[]>>((acc, item) => {
    acc[item.laneId] ??= []
    acc[item.laneId].push(item)
    return acc
  }, {})

  for (const laneId in grouped) {
    grouped[laneId].forEach((item, index) => {
      batch.update(doc(db, collectionRef, item.id), {
        laneId,
        order: (index + 1) * step,
        updatedAt: serverTimestamp(),
      })
    })
  }

  await batch.commit()
}
