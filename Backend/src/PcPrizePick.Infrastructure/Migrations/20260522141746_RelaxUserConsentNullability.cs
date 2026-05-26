using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcPrizePick.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RelaxUserConsentNullability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Null any existing rows that carry the sentinel default the
            //    AddUserConsents migration stamped on backfill. The C#
            //    default was `new DateTimeOffset(new DateTime(1, 1, 1, ...))`
            //    — Npgsql usually persists that as `0001-01-01 00:00:00+00`,
            //    but on some setups (DateRange / legacy timestamp mode) it
            //    lands as `-infinity` instead, so we cover both. Real
            //    consent is stamped 2026+, so anything <= year 1 is the
            //    sentinel — POPIA-wise NULL is more honest than a value
            //    that masquerades as recorded consent.
            migrationBuilder.Sql(
                "UPDATE users SET \"AcceptedTermsAt\" = NULL " +
                "WHERE \"AcceptedTermsAt\" <= TIMESTAMPTZ '0001-01-02';");
            migrationBuilder.Sql(
                "UPDATE users SET \"AcceptedPrivacyAt\" = NULL " +
                "WHERE \"AcceptedPrivacyAt\" <= TIMESTAMPTZ '0001-01-02';");

            // 2. Drop the column-level defaults so future inserts that omit
            //    these columns leave them NULL instead of resurrecting the
            //    sentinel value.
            migrationBuilder.Sql(
                "ALTER TABLE users ALTER COLUMN \"AcceptedTermsAt\" DROP DEFAULT;");
            migrationBuilder.Sql(
                "ALTER TABLE users ALTER COLUMN \"AcceptedPrivacyAt\" DROP DEFAULT;");

            // 3. Relax the NOT NULL constraint.
            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "AcceptedTermsAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "AcceptedPrivacyAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "AcceptedTermsAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)),
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "AcceptedPrivacyAt",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)),
                oldClrType: typeof(DateTimeOffset),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}
