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
            // 1. Null any existing rows that carry the `-infinity` sentinel
            //    stamped by the previous migration. POPIA-wise a sentinel
            //    timestamp is worse than NULL — NULL is honest about the
            //    absence of consent on file.
            migrationBuilder.Sql(
                "UPDATE users SET \"AcceptedTermsAt\" = NULL " +
                "WHERE \"AcceptedTermsAt\" = TIMESTAMPTZ '-infinity';");
            migrationBuilder.Sql(
                "UPDATE users SET \"AcceptedPrivacyAt\" = NULL " +
                "WHERE \"AcceptedPrivacyAt\" = TIMESTAMPTZ '-infinity';");

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
