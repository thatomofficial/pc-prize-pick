using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PcPrizePick.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddInventorySchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "competitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    BuildTagline = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    PrizeValueCents = table.Column<long>(type: "bigint", nullable: false),
                    EntryPriceCents = table.Column<long>(type: "bigint", nullable: false),
                    CashAlternativeCents = table.Column<long>(type: "bigint", nullable: false),
                    TotalEntries = table.Column<int>(type: "integer", nullable: false),
                    EntriesSold = table.Column<int>(type: "integer", nullable: false),
                    ClosesAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    spec_cpu = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    spec_gpu = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    spec_ram = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    spec_storage = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    AccentHue = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_competitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "cpus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Brand = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Model = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Cores = table.Column<int>(type: "integer", nullable: true),
                    Threads = table.Column<int>(type: "integer", nullable: true),
                    BaseClockGhz = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    BoostClockGhz = table.Column<decimal>(type: "numeric(4,2)", precision: 4, scale: 2, nullable: true),
                    Socket = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    TdpWatts = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cpus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "gpus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Brand = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Model = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    VramGb = table.Column<int>(type: "integer", nullable: true),
                    MemoryType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    PowerDrawWatts = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_gpus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "motherboards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Brand = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Model = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Chipset = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Socket = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    FormFactor = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    RamType = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    MaxRamGb = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_motherboards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "psus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Brand = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Model = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Wattage = table.Column<int>(type: "integer", nullable: true),
                    EfficiencyRating = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Modularity = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_psus", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pc_builds",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    ShortDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FullDescription = table.Column<string>(type: "text", nullable: true),
                    EstimatedValue = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    CashAlternativeValue = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    BuildStatus = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    IsFeatured = table.Column<bool>(type: "boolean", nullable: false),
                    CpuId = table.Column<Guid>(type: "uuid", nullable: true),
                    GpuId = table.Column<Guid>(type: "uuid", nullable: true),
                    MotherboardId = table.Column<Guid>(type: "uuid", nullable: true),
                    PsuId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceProductUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SourceRetailer = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    SourceImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ScrapeConfidence = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ScrapeWarnings = table.Column<List<string>>(type: "jsonb", nullable: false),
                    RawSpecs = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pc_builds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pc_builds_cpus_CpuId",
                        column: x => x.CpuId,
                        principalTable: "cpus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_pc_builds_gpus_GpuId",
                        column: x => x.GpuId,
                        principalTable: "gpus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_pc_builds_motherboards_MotherboardId",
                        column: x => x.MotherboardId,
                        principalTable: "motherboards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_pc_builds_psus_PsuId",
                        column: x => x.PsuId,
                        principalTable: "psus",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_competitions_Slug",
                table: "competitions",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cpus_Brand_Model",
                table: "cpus",
                columns: new[] { "Brand", "Model" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_gpus_Brand_Model",
                table: "gpus",
                columns: new[] { "Brand", "Model" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_motherboards_Brand_Model",
                table: "motherboards",
                columns: new[] { "Brand", "Model" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pc_builds_CpuId",
                table: "pc_builds",
                column: "CpuId");

            migrationBuilder.CreateIndex(
                name: "IX_pc_builds_GpuId",
                table: "pc_builds",
                column: "GpuId");

            migrationBuilder.CreateIndex(
                name: "IX_pc_builds_MotherboardId",
                table: "pc_builds",
                column: "MotherboardId");

            migrationBuilder.CreateIndex(
                name: "IX_pc_builds_PsuId",
                table: "pc_builds",
                column: "PsuId");

            migrationBuilder.CreateIndex(
                name: "IX_pc_builds_Slug",
                table: "pc_builds",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_psus_Brand_Model",
                table: "psus",
                columns: new[] { "Brand", "Model" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "competitions");

            migrationBuilder.DropTable(
                name: "pc_builds");

            migrationBuilder.DropTable(
                name: "cpus");

            migrationBuilder.DropTable(
                name: "gpus");

            migrationBuilder.DropTable(
                name: "motherboards");

            migrationBuilder.DropTable(
                name: "psus");
        }
    }
}
