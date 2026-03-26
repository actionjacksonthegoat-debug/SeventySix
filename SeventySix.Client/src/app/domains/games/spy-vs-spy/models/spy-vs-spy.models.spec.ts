// <copyright file="spy-vs-spy.models.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Spy vs Spy model enum member existence tests.
 * Pure TypeScript assertions — no TestBed required.
 */

import {
	CombatResult,
	FurnitureType,
	ItemType,
	RemedyType,
	RoomId,
	SearchResult,
	SpyGameState,
	SpyIdentity,
	StunState,
	TrapType,
	TurnPhase
} from "@games/spy-vs-spy/models/spy-vs-spy.models";

describe("SpyIdentity",
	() =>
	{
		it("should have Black member",
			() =>
			{
				expect(SpyIdentity.Black)
					.toBe("Black");
			});

		it("should have White member",
			() =>
			{
				expect(SpyIdentity.White)
					.toBe("White");
			});

		it("should have exactly 2 members",
			() =>
			{
				const members: string[] =
					Object.values(SpyIdentity);
				expect(members.length)
					.toBe(2);
			});
	});

describe("RoomId",
	() =>
	{
		it("should have BeachShack member",
			() =>
			{
				expect(RoomId.BeachShack)
					.toBe("BeachShack");
			});

		it("should have JungleHQ member",
			() =>
			{
				expect(RoomId.JungleHQ)
					.toBe("JungleHQ");
			});

		it("should have Watchtower member",
			() =>
			{
				expect(RoomId.Watchtower)
					.toBe("Watchtower");
			});

		it("should have CoveCave member",
			() =>
			{
				expect(RoomId.CoveCave)
					.toBe("CoveCave");
			});

		it("should have Compound member",
			() =>
			{
				expect(RoomId.Compound)
					.toBe("Compound");
			});

		it("should have Library member",
			() =>
			{
				expect(RoomId.Library)
					.toBe("Library");
			});

		it("should have exactly 6 members",
			() =>
			{
				const members: string[] =
					Object.values(RoomId);
				expect(members.length)
					.toBe(6);
			});
	});

describe("ItemType",
	() =>
	{
		it("should have SecretDocuments member",
			() =>
			{
				expect(ItemType.SecretDocuments)
					.toBe("SecretDocuments");
			});

		it("should have Passport member",
			() =>
			{
				expect(ItemType.Passport)
					.toBe("Passport");
			});

		it("should have KeyCard member",
			() =>
			{
				expect(ItemType.KeyCard)
					.toBe("KeyCard");
			});

		it("should have MoneyBag member",
			() =>
			{
				expect(ItemType.MoneyBag)
					.toBe("MoneyBag");
			});

		it("should have exactly 4 members",
			() =>
			{
				const members: string[] =
					Object.values(ItemType);
				expect(members.length)
					.toBe(4);
			});
	});

describe("TrapType",
	() =>
	{
		it("should have Bomb member",
			() =>
			{
				expect(TrapType.Bomb)
					.toBe("Bomb");
			});

		it("should have SpringTrap member",
			() =>
			{
				expect(TrapType.SpringTrap)
					.toBe("Spring");
			});

		it("should have exactly 2 members",
			() =>
			{
				const members: string[] =
					Object.values(TrapType);
				expect(members.length)
					.toBe(2);
			});
	});

describe("SpyGameState",
	() =>
	{
		it("should have Idle member",
			() =>
			{
				expect(SpyGameState.Idle)
					.toBe("Idle");
			});

		it("should have Loading member",
			() =>
			{
				expect(SpyGameState.Loading)
					.toBe("Loading");
			});

		it("should have Ready member",
			() =>
			{
				expect(SpyGameState.Ready)
					.toBe("Ready");
			});

		it("should have Playing member",
			() =>
			{
				expect(SpyGameState.Playing)
					.toBe("Playing");
			});

		it("should have Won member",
			() =>
			{
				expect(SpyGameState.Won)
					.toBe("Won");
			});

		it("should have Escaping member",
			() =>
			{
				expect(SpyGameState.Escaping)
					.toBe("Escaping");
			});

		it("should have Lost member",
			() =>
			{
				expect(SpyGameState.Lost)
					.toBe("Lost");
			});

		it("should have exactly 8 members",
			() =>
			{
				const members: string[] =
					Object.values(SpyGameState);
				expect(members.length)
					.toBe(8);
			});
	});

describe("StunState",
	() =>
	{
		it("should have None member",
			() =>
			{
				expect(StunState.None)
					.toBe("None");
			});

		it("should have BombStunned member",
			() =>
			{
				expect(StunState.BombStunned)
					.toBe("BombStunned");
			});

		it("should have SpringLaunched member",
			() =>
			{
				expect(StunState.SpringLaunched)
					.toBe("SpringLaunched");
			});

		it("should have exactly 3 members",
			() =>
			{
				const members: string[] =
					Object.values(StunState);
				expect(members.length)
					.toBe(3);
			});
	});

describe("FurnitureType",
	() =>
	{
		it("should have Barrel member",
			() =>
			{
				expect(FurnitureType.Barrel)
					.toBe("Barrel");
			});

		it("should have Crate member",
			() =>
			{
				expect(FurnitureType.Crate)
					.toBe("Crate");
			});

		it("should have Desk member",
			() =>
			{
				expect(FurnitureType.Desk)
					.toBe("Desk");
			});

		it("should have Cabinet member",
			() =>
			{
				expect(FurnitureType.Cabinet)
					.toBe("Cabinet");
			});

		it("should have Bookshelf member",
			() =>
			{
				expect(FurnitureType.Bookshelf)
					.toBe("Bookshelf");
			});

		it("should have exactly 5 members",
			() =>
			{
				const members: string[] =
					Object.values(FurnitureType);
				expect(members.length)
					.toBe(5);
			});
	});

describe("TurnPhase",
	() =>
	{
		it("should have Player1 member",
			() =>
			{
				expect(TurnPhase.Player1)
					.toBe("Player1");
			});

		it("should have Player2 member",
			() =>
			{
				expect(TurnPhase.Player2)
					.toBe("Player2");
			});

		it("should have exactly 2 members",
			() =>
			{
				const members: string[] =
					Object.values(TurnPhase);
				expect(members.length)
					.toBe(2);
			});
	});

describe("CombatResult",
	() =>
	{
		it("should have exactly 3 members",
			() =>
			{
				const members: string[] =
					Object.values(CombatResult);
				expect(members.length)
					.toBe(3);
			});
	});

describe("RemedyType",
	() =>
	{
		it("should have WireCutters member",
			() =>
			{
				expect(RemedyType.WireCutters)
					.toBe("WireCutters");
			});

		it("should have Shield member",
			() =>
			{
				expect(RemedyType.Shield)
					.toBe("Shield");
			});

		it("should have exactly 2 members",
			() =>
			{
				const members: string[] =
					Object.values(RemedyType);
				expect(members.length)
					.toBe(2);
			});
	});

describe("SearchResult",
	() =>
	{
		it("should have exactly 4 members",
			() =>
			{
				const members: string[] =
					Object.values(SearchResult);
				expect(members.length)
					.toBe(4);
			});
	});