-- +goose Up
-- +goose StatementBegin
drop schema if exists core cascade;
create schema if not exists core;


create or replace function core.unix_timestamp()
    returns bigint as
$$
begin
    return extract(epoch from now()) * 1000;
end
$$ language plpgsql;

create or replace function core.unix_timestamp_plus_interval(_interval interval)
    returns bigint as
$$
begin
    return extract(epoch from now()) * 1000 + extract(milliseconds from _interval);
end
$$ language plpgsql;

create or replace function core.ksuid()
    returns char(27) as
$$
declare
    v_time     timestamp := null;
    v_seconds  numeric(50)              := null;
    v_numeric  numeric(50)              := null;
    v_epoch    numeric(50)              = 1400000000; -- 2014-05-13T16:53:20Z
    v_base62   text                     := '';
    v_alphabet char array[62]           := array [
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
        'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
        'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
        'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 'x', 'y', 'z'];
begin
    v_time := clock_timestamp();
    v_seconds := EXTRACT(EPOCH FROM v_time) - v_epoch;
    v_numeric := v_seconds * pow(2::numeric(50), 128) -- 32 bits for seconds and 128 bits for randomness
        + ((random()::numeric(70, 20) * pow(2::numeric(70, 20), 48))::numeric(50) *
           pow(2::numeric(50), 80)::numeric(50))
        + ((random()::numeric(70, 20) * pow(2::numeric(70, 20), 40))::numeric(50) *
           pow(2::numeric(50), 40)::numeric(50))
        + (random()::numeric(70, 20) * pow(2::numeric(70, 20), 40))::numeric(50);

    while
        v_numeric <> 0
        loop
            v_base62 := v_base62 || v_alphabet[mod(v_numeric, 62) + 1];
            v_numeric := div(v_numeric, 62);
        end loop;
    v_base62 := reverse(v_base62);
    v_base62 := lpad(v_base62, 27, '0');

    return v_base62;
end
$$ language plpgsql;

CREATE OR REPLACE FUNCTION core.current_user_id() RETURNS text AS $$
DECLARE
  user_config text;
  user_data jsonb;
  result_user_id text;
BEGIN
  -- Get the config value, default to empty string if not set
  user_config := current_setting('core.user', true);
  RAISE NOTICE '[DEBUG current_user_id] user_config = % (type: %)', user_config, pg_typeof(user_config);

  -- Check if config is empty or null
  IF user_config IS NULL OR user_config = '' THEN
    RAISE NOTICE '[DEBUG current_user_id] user_config is NULL or empty, returning NULL';
    RETURN NULL;
  END IF;

  BEGIN
    -- Parse the JSON safely
    user_data := user_config::jsonb;
    RAISE NOTICE '[DEBUG current_user_id] user_data parsed = %', user_data;

    result_user_id := user_data ->> 'x-app-user-id';
    RAISE NOTICE '[DEBUG current_user_id] extracted result_user_id = %', result_user_id;

    IF result_user_id IS NOT NULL AND result_user_id != '' THEN
      RAISE NOTICE '[DEBUG current_user_id] returning user_id = %', result_user_id;
      RETURN result_user_id;
    END IF;

    RAISE NOTICE '[DEBUG current_user_id] result_user_id is NULL or empty after extraction';
  EXCEPTION WHEN OTHERS THEN
    -- If JSON parsing fails, log the error
    RAISE NOTICE '[DEBUG current_user_id] JSON parsing EXCEPTION: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NULL;
  END;

  RAISE NOTICE '[DEBUG current_user_id] reached final RETURN NULL';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

create or replace function core.system_user_id() returns char(27) as
$$
begin
    return 'system';
end;
$$
    language plpgsql;

create or replace function core.default_timezone()
    returns text
as
$$
declare
    _tz text;
begin
    select current_setting('timezone') into _tz;
    if _tz is null then
        return 'utc';
    end if;
    return _tz;
end
$$ language plpgsql;

-- logging

create table if not exists core.logging
(
    id               char(27) not null default core.ksuid() primary key,
    "schema"         name     not null,
    "table"          name     not null,
    retention_period interval          default '1 month':: interval
);

create or replace function core.log()
    returns trigger AS
$$
declare
    log_schema text;
    log_table  text;
    _setting       text;
begin
    _setting := current_setting('core.log', true);
    if _setting is not null then
        if current_setting('core.log', true) == 'off' then
            if tg_op = 'DELETE' then
                return old;
            end if;
            return old;
        end if;
    end if;

    if (TG_NARGS <> 2) then
        raise exception 'incorrect number of arguments for log(schema, table): %', TG_NARGS;
    end if;

    log_schema = TG_ARGV[0];
    log_table = TG_ARGV[1];

    if TG_OP in ('INSERT', 'UPDATE') and TG_LEVEL = 'ROW' then
        execute 'INSERT INTO ' || quote_ident(log_schema) || '.' || quote_ident(log_table) ||
                ' SELECT $1.*, $2, $3, core.unix_timestamp(), core.ksuid()' using NEW, 'system', TG_OP;
        return NEW;
    elseif TG_OP IN ('INSERT', 'UPDATE') and TG_LEVEL = 'STATEMENT' then
        execute 'INSERT INTO ' || quote_ident(log_schema) || '.' || quote_ident(log_table) ||
                ' SELECT n.*, $1, $2, core.unix_timestamp(), core.ksuid() FROM new_table n' using 'system', TG_OP;
        return NEW;
    elseif TG_OP = 'DELETE' and TG_LEVEL = 'ROW' then
        execute 'INSERT INTO ' || quote_ident(log_schema) || '.' || quote_ident(log_table) ||
                ' SELECT $1.*, $2, $3, core.unix_timestamp(), core.ksuid()' using OLD, 'system', TG_OP;
        return OLD;
    elseif TG_OP = 'DELETE' and TG_LEVEL = 'STATEMENT' then
        execute 'INSERT INTO ' || quote_ident(log_schema) || '.' || quote_ident(log_table) ||
                ' SELECT o.*, $1, $2, core.unix_timestamp(), core.ksuid() FROM old_table o' using 'system', TG_OP;
        return OLD;
    elseif TG_OP = 'TRUNCATE' then
        execute 'INSERT INTO ' || quote_ident(log_schema) || '.' || quote_ident(log_table) ||
                ' (user_id, action, action_time, log_id) VALUES ($1 , core.unix_timestamp(), core.ksuid())' using 'system', TG_OP;
        return null;
    end if;
end;
$$
    language 'plpgsql'
    volatile
    called on null input
    security definer;

create or replace function core.enable_logging(
    _source_schema name,
    _source_table name,
    _log_schema name = NULL::name,
    _log_table name = NULL::name,
    _retention_period interval = '1 month'::interval
)
    returns void as
$$
declare
    r record;

begin
    if _source_schema is null then
        raise exception 'must specify source schema: enable_log(source_schema, source_table, log_schema, log_table)';
    end if;

    if _source_table is null then
        raise exception 'must specify source table: enable_log(source_schema, source_table, log_schema, log_table)';
    end if;

    select into r *
    from core.log
    where "schema" = _source_schema
      and "table" = _source_table;
    if found then
        raise notice 'log already enabled for %.%', _source_schema, _source_table;
        return;
    end if;

    if _log_schema is null then
        _log_schema := _source_schema;
    end if;

    if _log_table is null then
        _log_table := _source_table || '_s';
    end if;

    -- check if the source table exists
    select table_schema, table_name
    into r
    from information_schema.tables
    where table_schema = _source_schema
      and table_name = _source_table;

    if not found then
        raise exception 'source table must exist (%.%)', _source_schema, _source_table;
    end if;

    select table_schema, table_name
    into r
    from information_schema.tables
    where table_schema = _log_schema
      and table_name = _log_table;

    if found then
        raise exception 'log table already exists (%.%)', _log_schema, _log_table;
    end if;

    -- check if the triggers already exist
    -- need to check the object source because the same trigger name may exist more than once in a schema if applied to different tables.
    select trigger_schema, trigger_name
    into r
    from information_schema.triggers
    where trigger_schema = _source_schema
      and trigger_name in
          (lower(_source_table) || '_tsr', lower(_source_table) || '_tsr', lower(_source_table) || '_tsr',
           lower(_source_table) || '_tsr')
      and event_object_schema = _source_schema
      and event_object_table = _source_table;

    if found then
        raise exception 'trigger already exist (%.%)', r.trigger_schema, r.trigger_name;
    end if;

    select trigger_schema, trigger_name
    into r
    from information_schema.triggers
    where trigger_schema = _source_schema
      and trigger_name = lower(_source_table) || '_tss'
      and event_object_schema = _source_schema
      and event_object_table = _source_table;

    if found then
        -- bug: postgres 9.1 through 10 does not support truncate triggers in this view.
        raise exception 'trigger already exist (%.%)', _source_schema, (lower(_source_table) || '_tss');
    end if;

    execute 'create table if not exists ' || quote_ident(_log_schema) || '.' || quote_ident(_log_table) ||
            ' as select *, ''system''::char(27) as user_id, ''insert''::varchar as action, core.unix_timestamp()::bigint as action_time, core.ksuid()::char(27) as log_id from ' ||
            quote_ident(_source_schema) || '.' || quote_ident(_source_table);

    -- add triggers
    execute 'create or replace trigger ' || lower(_source_table) || '_log_i after insert on ' ||
            quote_ident(_source_schema) || '.' ||
            quote_ident(_source_table) ||
            ' referencing new table as new_table for each statement execute procedure core.log(' ||
            quote_literal(_log_schema) || ', ' || quote_literal(_log_table) || ')';

    execute 'create or replace trigger ' || lower(_source_table) || '_log_u after update on ' ||
            quote_ident(_source_schema) || '.' ||
            quote_ident(_source_table) ||
            ' referencing old table as old_table new table as new_table for each statement execute procedure core.log(' ||
            quote_literal(_log_schema) || ', ' || quote_literal(_log_table) || ')';

    execute 'create or replace trigger ' || lower(_source_table) || '_log_d after delete on ' ||
            quote_ident(_source_schema) || '.' ||
            quote_ident(_source_table) ||
            ' referencing old table as old_table for each statement execute procedure core.log(' ||
            quote_literal(_log_schema) || ', ' || quote_literal(_log_table) || ')';

    execute 'create or replace trigger ' || lower(_source_table) || '_log_s before truncate on ' ||
            quote_ident(_source_schema) ||
            '.' || quote_ident(_source_table) || ' for each statement execute procedure core.log(' ||
            quote_literal(_log_schema) || ', ' || quote_literal(_log_table) || ')';

    execute 'create index on ' || quote_ident(_log_schema) || '.' || quote_ident(_log_table) ||
            ' using btree (id, action_time desc);';

    execute 'create index on ' || quote_ident(_log_schema) || '.' || quote_ident(_log_table) ||
            ' using btree (action_time desc) where action = ''truncate'';';

    insert into core.log ("schema", "table", retention_period)
    values (_source_schema, _source_table, _retention_period);

end;
$$
    language 'plpgsql'
    volatile
    called on null input
    security definer;

-- cdc

create or replace function core.cdc_notify()
    returns trigger as
$$

declare
    _id           name;
    _notification json;
    _channel      text = 'cdc';
begin
    -- check if the table has an id column
    select into _id column_name
    from information_schema.columns
    where table_schema = tg_table_schema
      and table_name = tg_table_name
      and column_name = 'id';
    if _id is null then
        raise warning 'cdc enabled for table % which does not have an id column', tg_table_name;
        if tg_op = 'DELETE' then
            return old;
        else
            return new;
        end if;
    end if;

    if tg_nargs > 0 then
        _channel = tg_argv[0];
    end if;

    case tg_op
        when 'UPDATE' then _notification = json_build_object(
                'timestamp', core.unix_timestamp(),
                'schema', tg_table_schema,
                'table', tg_table_name,
                'action', tg_op,
                'id', new.id,
                'old', row_to_json(old),
                'new', row_to_json(new));

        when 'INSERT' then _notification = json_build_object(
                'timestamp', core.unix_timestamp(),
                'schema', tg_table_schema,
                'table', tg_table_name,
                'action', tg_op,
                'id', new.id,
                'new', row_to_json(new));

        when 'DELETE' then _notification = json_build_object(
                'timestamp', core.unix_timestamp(),
                'schema', tg_table_schema,
                'table', tg_table_name,
                'action', tg_op,
                'id', old.id,
                'old', row_to_json(old));

        end case;

    perform pg_notify(_channel, _notification::text);

    return null;
end;
$$ language plpgsql;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
SELECT 'down SQL query';
-- +goose StatementEnd
