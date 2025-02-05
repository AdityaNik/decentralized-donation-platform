from algopy import (
     Global,
     Txn,
     gtxn,
     UInt64,
     arc4,
     itxn,
     Account,
     BoxMap,
     ARC4Contract
)

class CrazyContract(ARC4Contract):
    totalDonations: UInt64
    owner: Account
    doners: BoxMap[Account, UInt64]

    def __init__(self)->None:
        self.doners = BoxMap(Account, UInt64)

    @arc4.abimethod(create="require")
    def create_application(self)->None:
        self.owner = Global.creator_address
        self.totalDonations = UInt64(0)

    @arc4.abimethod
    def donate(self, amount: UInt64, payment_transaction:gtxn.PaymentTransaction )->None:
        assert payment_transaction.receiver == Global.current_application_address
        assert amount > UInt64(0)

        if payment_transaction.sender not in self.doners:
            self.doners[payment_transaction.sender] = UInt64(0)

        self.totalDonations += amount
        self.doners[payment_transaction.sender] += amount
    
    @arc4.abimethod
    def withdraw(self, amount: UInt64, receiver: Account)->None:
        assert Txn.sender == self.owner
        assert amount > UInt64(0)
        assert self.totalDonations >= amount

        itxn.Payment(
            amount=amount,
            receiver=receiver,
            fee=1000,
        ).submit()
        self.totalDonations -= amount

    @arc4.abimethod
    def get_total_donations(self)->UInt64:
        return self.totalDonations
    
    @arc4.abimethod
    def get_donations(self, account: Account)->UInt64:
        return self.doners[account]
    
    @arc4.abimethod(allow_actions=["DeleteApplication"])
    def delete(self)->None:
        assert Txn.sender == self.owner
        itxn.Payment(
            receiver=self.owner,
            amount=0,
            close_remainder_to=self.owner,
            fee=1000,
        ).submit()

        



    

    
