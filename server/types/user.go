package types

// save user secret info
type FirestoreUser struct {
	Uid   string `firestore:"uid"`
	Quota int    `firestore:"quota"`
}

func NewUser(uid string) *FirestoreUser {
	return &FirestoreUser{
		Uid: uid,
	}
}
